import customAttributes, {CustomAttributeRegistry} from 'custom-attributes/pkg/dist-umd'

// TODO: element behaviors currently don't work on elements when they are
// defined (via elementBehaviors.define()) after the elements are already in the
// DOM. Make it order-independent.

class BehaviorRegistry {
	constructor() {
		this._definedBehaviors = new Map()
	}

	define(name, Behavior) {
		if (!this._definedBehaviors.has(name)) {
			this._definedBehaviors.set(name, Behavior)
		} else {
			throw new Error(`Behavior ${name} is already defined.`)
		}
	}

	get(name) {
		return this._definedBehaviors.get(name)
	}

	has(name) {
		return this._definedBehaviors.has(name)
	}
}

window.elementBehaviors = new BehaviorRegistry()

// for semantic purpose
class BehaviorMap extends Map {}

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

// One instance of is instantiated per element with has="" attribute.
class HasAttribute {
	constructor() {
		// TODO constructor is confusing because this.ownerElement doesn't exist. Report to custom-attributes
	}

	connectedCallback() {
		this.observers = new Map()
		this.behaviors = this.ownerElement.behaviors
		this.connectedBehaviors = new Set()
		this.definePromises = new Map()
		this.foo = true
		this.changedCallback('', this.value)
	}

	disconnectedCallback() {
		this.changedCallback(this.value, '')
		this.observers && this.observers.clear()
		this.connectedBehaviors && this.connectedBehaviors.clear()
		if (this.definePromises) {
			for (const [, promise] of this.definePromises) promise.cancel()
			this.definePromises.clear()
		}
		delete this.behaviors
	}

	changedCallback(oldVal, newVal) {
		const newBehaviors = this.getBehaviorNames(newVal)
		const previousBehaviors = Array.from(this.behaviors.keys())

		// small optimization: if no previous or new behaviors, just quit
		// early. It would still function the same without this.
		if (newBehaviors.length == 0 && previousBehaviors.length == 0) return

		const {removed, added} = this.getDiff(previousBehaviors, newBehaviors)
		this.handleDiff(removed, added)
	}

	getBehaviorNames(string) {
		if (string.trim() == '') return []
		else return string.split(/\s+/)
	}

	getDiff(previousBehaviors, newBehaviors) {
		const diff = {
			removed: [],
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

	handleDiff(removed, added) {
		for (const name of removed) {
			if (!elementBehaviors.has(name)) continue
			this.disconnectBehavior(name)
		}

		for (const name of added) {
			if (!elementBehaviors.has(name)) continue
			this.connectBehavior(name)
		}
	}

	connectBehavior(name) {
		const Behavior = elementBehaviors.get(name)
		const behavior = new Behavior(this.ownerElement)
		this.behaviors.set(name, behavior)

		// read observedAttributes first, in case anything external fires
		// logic in the getter and expects it to happen before any
		// lifecycle methods (f.e. a library like SkateJS)
		const observedAttributes = behavior.constructor.observedAttributes

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
					behavior.connectedCallback()
				})
			} else {
				this.connectedBehaviors.add(behavior)
				behavior.connectedCallback()
			}
		}

		if (Array.isArray(observedAttributes) && observedAttributes.length) {
			this.fireInitialAttributeChangedCallbacks(behavior, observedAttributes)
			this.createAttributeObserver(behavior)
		}
	}

	disconnectBehavior(name) {
		const behavior = this.behaviors.get(name)

		if (this.ownerElement.isConnected) {
			if (this.connectedBehaviors.has(behavior)) {
				behavior.disconnectedCallback()
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

		this.behaviors.delete(name)
	}

	destroyAttributeObserver(behavior) {
		if (!this.observers.has(behavior)) return
		this.observers.get(behavior).disconnect()
		this.observers.delete(behavior)
	}

	// Behaviors observe attribute changes, implemented with MutationObserver
	//
	// We have to create one observer per behavior because otherwise
	// MutationObserver doesn't have an API for disconnecting from a single
	// element, only for disconnecting from all elements.
	createAttributeObserver(behavior) {
		const observer = new MutationObserver(records => {
			if (!behavior.attributeChangedCallback) return

			for (const record of records) {
				behavior.attributeChangedCallback(
					record.attributeName,
					record.oldValue,
					this.ownerElement.attributes[record.attributeName].value,
				)
			}
		})

		observer.observe(this.ownerElement, {
			attributes: true,
			attributeOldValue: true,
			attributeFilter: behavior.constructor.observedAttributes,
		})

		this.observers.set(behavior, observer)
	}

	fireInitialAttributeChangedCallbacks(behavior, attributes) {
		if (!behavior.attributeChangedCallback) return

		for (const name of attributes) {
			if (this.ownerElement.hasAttribute(name))
				behavior.attributeChangedCallback(name, null, this.ownerElement.attributes[name].value)
		}
	}
}

function Privates() {
	const storage = new WeakMap()

	return obj => {
		let privates = storage.get(obj)
		if (!privates) storage.set(obj, (privates = {}))
		return privates
	}
}

const _ = Privates()

class CancelablePromise extends Promise {
	constructor(executor, options) {
		const rejectOnCancel = options ? options.rejectOnCancel : false
		let originalReject

		// if the first arg is a promise-like
		if (typeof executor === 'object' && executor.then && executor.catch) {
			const promise = executor

			super((resolve, reject) => {
				originalReject = reject

				promise
					.then(value => {
						if (!this.canceled) resolve(value)
					})
					.catch(error => {
						if (!this.canceled) reject(error)
					})
			})
		} else {
			super((resolve, reject) => {
				originalReject = reject
				executor(
					value => {
						if (!this.canceled) resolve(value)
					},
					error => {
						if (!this.canceled) reject(error)
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
export const version = '2.1.3'
