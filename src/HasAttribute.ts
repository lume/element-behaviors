import '@lume/custom-attributes/dist/index.js' // polyfills global Custom Attributes API
import type {CustomAttribute} from '@lume/custom-attributes/dist/index.js'
import {CancelablePromise, PromiseCancellation} from './CancelablePromise.js'
import type {ElementWithBehaviors, PossibleBehaviorConstructor, PossibleBehaviorInstance} from './BehaviorRegistry.js'
import {BehaviorMap} from './BehaviorMap.js'

/**
 * Defines the global `has=""` attribute for assigning behaviors to an element.
 *
 * One instance of this class is instantiated per element with `has=""` attribute.
 *
 * If you're using element-behaviors, then all elements now also have a
 * `behaviors` property that is a map of behavior names to behavior instances.
 */
export class HasAttribute implements CustomAttribute {
	// Properties defined by CustomAttribute
	// TODO Ensure these types from from CustomAttribute
	declare ownerElement: ElementWithBehaviors
	declare value: string
	declare name: string

	get behaviors() {
		return this.ownerElement.behaviors
	}

	observers = new Map<PossibleBehaviorInstance, MutationObserver>()
	elementDefinedPromises = new Map<string, CancelablePromise<CustomElementConstructor>>()

	isConnected = false // TODO move to base class

	// TODO an improvement would be that behaviors are instantiated on element
	// construction, though that will add some complexity (probably patching of
	// many native APIs). Probably needs a change in custom-attributes first so it
	// handles attributes during element construction.
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
			const oldBehavior = previousBehaviors[i]!

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
		let Behavior = elementBehaviors.get(name)

		if (!Behavior) {
			await elementBehaviors.whenDefined(name)
			Behavior = elementBehaviors.get(name)!
		}

		// TODO Read observedAttributes during the define() call instead, like
		// custom elements.
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

				behavior.attributeChangedCallback(name, lastAttributeValues[name]!, record.oldValue, this.ownerElement)

				lastAttributeValues[name] = record.oldValue
			}

			let attr: Attr | null

			for (const name in lastAttributeValues) {
				attr = el.attributes.getNamedItem(name)
				behavior.attributeChangedCallback(
					name,
					lastAttributeValues[name]!,
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

// Avoid errors trying to use DOM APIs in non-DOM environments (f.e. server-side rendering).
if (globalThis.window?.document) {
	// stores the behaviors associated to each element.
	const behaviorMaps = new WeakMap<object, BehaviorMap>()

	Object.defineProperty(Element.prototype, 'behaviors', {
		get() {
			let behaviorMap: BehaviorMap | null = null

			if (behaviorMaps.has(this)) {
				behaviorMap = behaviorMaps.get(this)!
			} else {
				behaviorMaps.set(this, (behaviorMap = new BehaviorMap()))
			}

			return behaviorMap
		},
	})

	const _attachShadow = Element.prototype.attachShadow

	Element.prototype.attachShadow = function (options) {
		const root = _attachShadow.call(this, options)

		root.customAttributes.define('has', HasAttribute)

		return root
	}

	globalThis.customAttributes.define('has', HasAttribute)
}
