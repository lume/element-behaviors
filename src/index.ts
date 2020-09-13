import customAttributes, {CustomAttributeRegistry} from 'custom-attributes/pkg/dist-umd'
import {Constructor} from 'lowclass'

// TODO: element behaviors currently don't work on elements when they are
// defined (via elementBehaviors.define()) after the elements are already in the
// DOM. Make it order-independent.

type PossibleBehaviorInstance = {
	awaitElementDefined?: boolean
	connectedCallback?: () => void
	disconnectedCallback?: () => void
	attributeChangedCallback?: (attr: string, oldValue: string | null, newValue: string | null) => void
	[k: string]: any
	[k: number]: any
}

type PossibleBehaviorConstructor = Constructor<PossibleBehaviorInstance, [Element], {observedAttributes?: string[]}>

class BehaviorRegistry {
	protected _definedBehaviors = new Map<string, PossibleBehaviorConstructor>()

	define<T extends PossibleBehaviorConstructor>(name: string, Behavior: T) {
		if (!this._definedBehaviors.has(name)) {
			this._definedBehaviors.set(name, Behavior)
		} else {
			throw new Error(`Behavior ${name} is already defined.`)
		}
	}

	get(name: string) {
		return this._definedBehaviors.get(name)
	}

	has(name: string) {
		return this._definedBehaviors.has(name)
	}
}

declare global {
	const elementBehaviors: BehaviorRegistry
	interface Window {
		elementBehaviors: BehaviorRegistry
	}
}

export const elementBehaviors = (window.elementBehaviors = new BehaviorRegistry())

// for semantic purpose
class BehaviorMap<K, V> extends Map<K, V> {}

// stores the behaviors associated to each element.
const behaviorMaps = new WeakMap()

// All elements have a `behaviors` property. If null, it the element has no
// behaviors, otherwise the property is a map of behavior names to behavior
// instances.
Object.defineProperty(Element.prototype, 'behaviors', {
	get() {
		let thisBehaviors = null

		if (!behaviorMaps.has(this)) {
			behaviorMaps.set(this, (thisBehaviors = new BehaviorMap()))
		} else thisBehaviors = behaviorMaps.get(this)

		return thisBehaviors
	},
})

type ElementWithBehaviors = Element & {behaviors: BehaviorMap<string, PossibleBehaviorInstance>}

// One instance of is instantiated per element with has="" attribute.
class HasAttribute {
	// properties defined by custom-attributes
	ownerElement!: ElementWithBehaviors
	value!: string

	behaviors?: BehaviorMap<string, PossibleBehaviorInstance>

	observers = new Map<PossibleBehaviorInstance, MutationObserver>()
	connectedBehaviors = new Set<PossibleBehaviorInstance>()
	definePromises = new Map<string, CancelablePromise<void>>()

	connectedCallback() {
		this.behaviors = this.ownerElement.behaviors
		this.changedCallback('', this.value)
	}

	disconnectedCallback() {
		this.changedCallback(this.value, '')
		this.observers.clear()
		this.connectedBehaviors.clear()
		for (const [, promise] of this.definePromises) promise.cancel()
		this.definePromises.clear()
		delete this.behaviors
	}

	changedCallback(_oldVal: string, newVal: string) {
		const newBehaviors = this.getBehaviorNames(newVal)
		const previousBehaviors = Array.from(this.behaviors!.keys())

		// small optimization: if no previous or new behaviors, just quit
		// early. It would still function the same without this.
		if (newBehaviors.length == 0 && previousBehaviors.length == 0) return

		const {removed, added} = this.getDiff(previousBehaviors, newBehaviors)
		this.handleDiff(removed, added)
	}

	private getBehaviorNames(string: string) {
		if (string.trim() == '') return []
		else return string.split(/\s+/)
	}

	private getDiff(previousBehaviors: string[], newBehaviors: string[]) {
		const diff = {
			removed: [] as string[],
			added: newBehaviors,
		}

		for (let i = 0, l = previousBehaviors.length; i < l; i += 1) {
			const oldBehavior = previousBehaviors[i]

			// if it exists in the previousBehaviors but not the newBehaviors, then
			// the node was removed.
			if (!diff.added.includes(oldBehavior)) {
				diff.removed.push(oldBehavior)
			}

			// otherwise the old value also exists in the set of new values, so
			// therefore it wasn't added or removed, so let's remove it so we
			// don't count it as added
			else {
				diff.added.splice(diff.added.indexOf(oldBehavior), 1)
			}
		}

		return diff
	}

	private handleDiff(removed: string[], added: string[]) {
		for (const name of removed) this.disconnectBehavior(name)
		for (const name of added) this.connectBehavior(name)
	}

	private connectBehavior(name: string) {
		const Behavior = elementBehaviors.get(name)

		if (!Behavior) return

		const behavior = new Behavior(this.ownerElement)
		this.behaviors!.set(name, behavior)

		// read observedAttributes first, in case anything external fires
		// logic in the getter and expects it to happen before any
		// lifecycle methods (f.e. a library like SkateJS)
		const observedAttributes = (behavior.constructor as PossibleBehaviorConstructor).observedAttributes

		if (this.ownerElement.isConnected) {
			const tagName = this.ownerElement.tagName

			// if the element is a custom element and the behavior specifies to wait for it to be defined
			if (behavior.awaitElementDefined && tagName.includes('-')) {
				const promiseId = name + '_' + tagName
				let promise = this.definePromises.get(promiseId)

				if (!promise) {
					promise = new CancelablePromise(customElements.whenDefined(tagName.toLowerCase()), {
						rejectOnCancel: false,
					})
					this.definePromises.set(promiseId, promise)
				}

				promise.then(() => {
					this.definePromises.delete(promiseId)
					this.connectedBehaviors.add(behavior)
					behavior.connectedCallback && behavior.connectedCallback()
				})
			} else {
				this.connectedBehaviors.add(behavior)
				behavior.connectedCallback && behavior.connectedCallback()
			}
		}

		if (Array.isArray(observedAttributes) && observedAttributes.length) {
			this.fireInitialAttributeChangedCallbacks(behavior, observedAttributes)
			this.createAttributeObserver(behavior)
		}
	}

	private disconnectBehavior(name: string) {
		const behavior = this.behaviors!.get(name)

		if (!behavior) return

		{
			if (this.connectedBehaviors.has(behavior)) {
				behavior.disconnectedCallback && behavior.disconnectedCallback()
				this.connectedBehaviors.delete(behavior)
			}

			const promiseId = name + '_' + this.ownerElement.tagName
			const promise = this.definePromises.get(promiseId)

			if (promise) {
				promise.cancel()
				this.definePromises.delete(promiseId)
			}
		}

		this.destroyAttributeObserver(behavior)

		this.behaviors!.delete(name)
	}

	destroyAttributeObserver(behavior: PossibleBehaviorInstance) {
		const observer = this.observers.get(behavior)
		if (!observer) return
		observer.disconnect()
		this.observers.delete(behavior)
	}

	// Behaviors observe attribute changes, implemented with MutationObserver
	//
	// We have to create one observer per behavior because otherwise
	// MutationObserver doesn't have an API for disconnecting from a single
	// element, only for disconnecting from all elements.
	createAttributeObserver(behavior: PossibleBehaviorInstance) {
		const el = this.ownerElement

		const observer = new MutationObserver(records => {
			if (!behavior.attributeChangedCallback) return

			// Because we get mutations in order, and we have all the attribute
			// values for a given attribute along the way while iterating on
			// mutation records, we keep track of previous and current attribute
			// values (per attribute name) with this variable and thus we can
			// fire behavior.attributeChangedCallback with each previous and
			// current value. For why we need to do this, see
			// https://stackoverflow.com/questions/60593551.
			let lastAttributeValues: {[k: string]: string | null} = {}

			let name = ''

			for (const record of records) {
				if (record.type !== 'attributes') continue

				name = record.attributeName!

				if (lastAttributeValues[name] === undefined) {
					lastAttributeValues[name] = record.oldValue
					continue
				}

				behavior.attributeChangedCallback(name, lastAttributeValues[name], record.oldValue)

				lastAttributeValues[name] = record.oldValue
			}

			let attr: Attr | null

			for (const name in lastAttributeValues) {
				attr = el.attributes.getNamedItem(name)
				behavior.attributeChangedCallback(name, lastAttributeValues[name], attr === null ? null : attr.value)
			}
		})

		observer.observe(el, {
			attributes: true,
			attributeOldValue: true,
			attributeFilter: (behavior.constructor as PossibleBehaviorConstructor).observedAttributes,
		})

		this.observers.set(behavior, observer)
	}

	fireInitialAttributeChangedCallbacks(behavior: PossibleBehaviorInstance, attributes: string[]) {
		if (!behavior.attributeChangedCallback) return

		for (const name of attributes) {
			if (this.ownerElement.hasAttribute(name))
				behavior.attributeChangedCallback(name, null, this.ownerElement.attributes.getNamedItem(name)!.value)
		}
	}
}

// TODO safe types for privates
function Privates() {
	const storage = new WeakMap()

	return (obj: object) => {
		let privates = storage.get(obj)
		if (!privates) storage.set(obj, (privates = {}))
		return privates
	}
}

const _ = Privates()

interface CancelablePromiseOptions {
	rejectOnCancel?: boolean
}

class CancelablePromise<T> extends Promise<T> {
	canceled: boolean

	constructor(
		executor:
			| Promise<T>
			| ((resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void),
		options: CancelablePromiseOptions,
	) {
		const rejectOnCancel = options ? options.rejectOnCancel : false
		let originalReject

		// if the first arg is a promise-like
		if (executor instanceof Promise) {
			const promise = executor

			super((resolve, reject) => {
				originalReject = reject

				promise
					.then(value => {
						if (this.canceled) return
						resolve(value)
					})
					.catch(error => {
						if (this.canceled) return
						reject(error)
					})
			})
		} else {
			super((resolve, reject) => {
				originalReject = reject
				executor(
					value => {
						if (this.canceled) return
						resolve(value)
					},
					error => {
						if (this.canceled) return
						reject(error)
					},
				)
			})
		}

		this.canceled = false
		_(this).originalReject = originalReject
		_(this).rejectOnCancel = rejectOnCancel
	}

	cancel() {
		this.canceled = true

		if (_(this).rejectOnCancel) {
			_(this).originalReject(new PromiseCancellation('canceled'))
		}
	}
}

class PromiseCancellation extends Error {}

customAttributes.define('has', HasAttribute)

if (Element.prototype.attachShadow) {
	const _attachShadow = Element.prototype.attachShadow

	Element.prototype.attachShadow = function(...args) {
		const root = _attachShadow.call(this, ...args)
		const attributes = new CustomAttributeRegistry(root)

		attributes.define('has', HasAttribute)

		return root
	}
}

// Leave this last line alone, it gets automatically updated when publishing a
// new version of this package.
export const version = '2.2.3'
