import {customAttributes, CustomAttributeRegistry, CustomAttribute} from '@lume/custom-attributes/dist/index.js'
import {$TRACK} from 'solid-js'
import {createMutable, modifyMutable, reconcile} from 'solid-js/store'

import type {Constructor} from 'lowclass'

// TODO: element behaviors currently don't work on elements when they are
// defined (via elementBehaviors.define()) after the elements are already in the
// DOM. Make it order-independent.

type PossibleBehaviorInstance = {
	connectedCallback?: (element: Element) => void
	disconnectedCallback?: (element: Element) => void
	attributeChangedCallback?: (attr: string, oldValue: string | null, newValue: string | null, element: Element) => void
	[k: string]: any
	[k: number]: any
}

type PossibleBehaviorConstructor = Constructor<
	PossibleBehaviorInstance,
	[ElementWithBehaviors],
	{awaitElementDefined?: boolean; observedAttributes?: string[]}
>

const whenDefinedPromises: Map<string, Promise<void>> = new Map()

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

	// TODO WIP, similar to customElements.whenDefined, so that code can wait for
	// behaviors to be defined, which will help with load order issues when we
	// set autoDefineElements to true by default in LUME (causes elements to be
	// defined in module load order, which may not happen after all behaviors
	// are loaded).
	whenDefined(name: string) {
		let resolve!: () => void
		const p = new Promise<void>(r => (resolve = r))

		if (!this.has(name)) {
			whenDefinedPromises.set(name, p)
		} else {
			resolve()
		}

		return p
	}
}

declare global {
	const elementBehaviors: BehaviorRegistry
	interface Window {
		elementBehaviors: BehaviorRegistry
	}
}

export const elementBehaviors = (window.elementBehaviors = new BehaviorRegistry())

/**
 * A map of behavior names to their defined classes.
 *
 * Reactive in Solid.js.
 */
export class BehaviorMap extends Map<string, PossibleBehaviorInstance> {
	#reactivityTriggerObject = createMutable<Record<string, PossibleBehaviorInstance>>({})

	find(predicate: (name: string, behavior: PossibleBehaviorInstance) => boolean) {
		let result: PossibleBehaviorInstance | undefined = void undefined

		for (const [name, behavior] of this) {
			if (!predicate(name, behavior)) continue
			result = behavior
			break
		}

		return result
	}

	override get(key: string): PossibleBehaviorInstance | undefined {
		// read, causes tracking in Solid.js effects.
		this.#reactivityTriggerObject[key]

		return super.get(key)
	}

	override set(key: string, value: PossibleBehaviorInstance): this {
		queueMicrotask(() => {
			// write, triggers Solid.js effects
			this.#reactivityTriggerObject[key] = value
		})

		super.set(key, value)
		return this
	}

	override delete(key: string): boolean {
		queueMicrotask(() => {
			// write, triggers Solid.js effects
			delete this.#reactivityTriggerObject[key]
		})

		return super.delete(key)
	}

	override clear(): void {
		queueMicrotask(() => {
			// delete all properties, trigger single Solid.js effect update
			modifyMutable(this.#reactivityTriggerObject, reconcile({}))
		})

		super.clear()
	}

	override has(key: string): boolean {
		// read, causes tracking in Solid.js effects.
		// (TODO `in` operator not reactive yet, https://github.com/solidjs/solid/issues/1107)
		// key in this.#reactivityTriggerObject
		// Workaround, read the property
		this.#reactivityTriggerObject[key]

		return super.has(key)
	}

	override entries(): IterableIterator<[string, PossibleBehaviorInstance]> {
		// track all properties in a Solid effect
		// @ts-expect-error
		this.#reactivityTriggerObject[$TRACK]

		return super.entries()
	}

	override [Symbol.iterator](): IterableIterator<[string, PossibleBehaviorInstance]> {
		// track all properties in a Solid effect
		// @ts-expect-error
		this.#reactivityTriggerObject[$TRACK]

		return super[Symbol.iterator]()
	}

	override forEach(
		callbackfn: (value: PossibleBehaviorInstance, key: string, map: Map<string, PossibleBehaviorInstance>) => void,
		thisArg?: any,
	): void {
		// track all properties in a Solid effect
		// @ts-expect-error
		this.#reactivityTriggerObject[$TRACK]

		super.forEach(callbackfn, thisArg)
	}

	override keys(): IterableIterator<string> {
		// track all properties in a Solid effect
		// @ts-expect-error
		this.#reactivityTriggerObject[$TRACK]

		return super.keys()
	}

	override get size(): number {
		// track all properties in a Solid effect
		// @ts-expect-error
		this.#reactivityTriggerObject[$TRACK]

		return super.size
	}
	override set size(n: number) {
		// @ts-expect-error readonly property according to TS, but in JS it is
		// assignable though nothing happens. We need this so that the property
		// behaves the same after we override it.
		super.size = n
	}
}

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

export type ElementBehaviors = {behaviors: BehaviorMap}

export type ElementWithBehaviors = Element & ElementBehaviors

// One instance of is instantiated per element with has="" attribute.
class HasAttribute implements CustomAttribute {
	// properties defined by CustomAttribute
	declare ownerElement: ElementWithBehaviors
	declare value: string
	declare name: string

	get behaviors() {
		return this.ownerElement.behaviors
	}

	observers = new Map<PossibleBehaviorInstance, MutationObserver>()
	elementDefinedPromises = new Map<string, CancelablePromise<CustomElementConstructor>>()

	isConnected = false // TODO move to base class

	connectedCallback() {
		this.isConnected = true
		this.changedCallback('', this.value)
	}

	disconnectedCallback() {
		this.isConnected = false
		this.#skipConnectedCheck = true
		this.changedCallback(this.value, '')
		this.#skipConnectedCheck = false
	}

	#skipConnectedCheck = false

	changedCallback(oldVal: string, newVal: string) {
		if (!this.#skipConnectedCheck) {
			if (!this.isConnected) return
		}

		const currentBehaviors = this.getBehaviorNames(newVal)
		const previousBehaviors = this.getBehaviorNames(oldVal)

		// small optimization: if no previous or new behaviors, just quit
		// early. It would still function the same without this.
		if (currentBehaviors.length == 0 && previousBehaviors.length == 0) return

		const {removed, added} = this.getDiff(previousBehaviors, currentBehaviors)
		this.handleDiff(removed, added)
	}

	private getBehaviorNames(string: string) {
		if (string.trim() == '') return []
		else return string.split(/\s+/)
	}

	private getDiff(previousBehaviors: string[], currentBehaviors: string[]) {
		const diff = {
			removed: [] as string[],
			added: currentBehaviors,
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

	private async connectBehavior(name: string) {
		const Behavior = elementBehaviors.get(name)

		if (!Behavior) return

		const observedAttributes = Behavior.observedAttributes

		const tagName = this.ownerElement.tagName

		try {
			// if the element is a custom element and the behavior specifies to wait for it to be defined
			if (Behavior.awaitElementDefined && tagName.includes('-') && !customElements.get(tagName.toLowerCase())) {
				const promiseId = name + '_' + tagName
				let promise = this.elementDefinedPromises.get(promiseId)

				if (!promise) {
					promise = new CancelablePromise(customElements.whenDefined(tagName.toLowerCase()), {
						rejectOnCancel: true,
					})
					this.elementDefinedPromises.set(promiseId, promise)
				}

				await promise
				this.elementDefinedPromises.delete(promiseId)
			}

			if (this.isConnected) {
				const behavior = new Behavior(this.ownerElement)
				this.behaviors.set(name, behavior)
				behavior.connectedCallback?.(this.ownerElement)

				if (Array.isArray(observedAttributes) && observedAttributes.length) {
					this.fireInitialAttributeChangedCallbacks(behavior, observedAttributes)
					this.createAttributeObserver(behavior)
				}
			}
		} catch (e) {
			if (!(e instanceof PromiseCancellation)) throw e

			// do nothing if promise canceled
		}
	}

	private disconnectBehavior(name: string) {
		const promiseId = name + '_' + this.ownerElement.tagName
		const promise = this.elementDefinedPromises.get(promiseId)

		if (promise) {
			promise.cancel()
			this.elementDefinedPromises.delete(promiseId)
		}

		const behavior = this.behaviors.get(name)

		// There will only be a behavior if connectBehavior both created it and
		// ran its connectedCallback.
		if (!behavior) return

		behavior.disconnectedCallback?.(this.ownerElement)
		this.destroyAttributeObserver(behavior)
		this.behaviors.delete(name)
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

				behavior.attributeChangedCallback(name, lastAttributeValues[name], record.oldValue, this.ownerElement)

				lastAttributeValues[name] = record.oldValue
			}

			let attr: Attr | null

			for (const name in lastAttributeValues) {
				attr = el.attributes.getNamedItem(name)
				behavior.attributeChangedCallback(
					name,
					lastAttributeValues[name],
					attr === null ? null : attr.value,
					this.ownerElement,
				)
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
				behavior.attributeChangedCallback(
					name,
					null,
					this.ownerElement.attributes.getNamedItem(name)!.value,
					this.ownerElement,
				)
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
		executor: Promise<T> | ((resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void),
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

// TODO move this to custom-attributes
if (Element.prototype.attachShadow) {
	const _attachShadow = Element.prototype.attachShadow

	Element.prototype.attachShadow = function (...args) {
		const root = _attachShadow.call(this, ...args)
		const attributes = new CustomAttributeRegistry(root)

		attributes.define('has', HasAttribute)

		return root
	}
}

// Leave this last line alone, it gets automatically updated when publishing a
// new version of this package.
export const version = '3.0.2'
