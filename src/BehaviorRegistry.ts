import type {Constructor} from 'lowclass'
import type {BehaviorMap} from './BehaviorMap.js'

/** A registry of behaviors. Similar to CustomElementRegistry. */
export class BehaviorRegistry {
	#definedBehaviors = new Map<string, PossibleBehaviorConstructor>()
	#whenDefinedPromises: Map<string, {promise: Promise<void>; resolve: () => void}> = new Map()

	/**
	 * Associate a class `Behavior` to a given behavior `name`. Any time an
	 * element has the named behavior, the given class will be instantiated and
	 * the instance will be able to apply logic to its host element.
	 */
	define<T extends PossibleBehaviorConstructor>(name: string, Behavior: T) {
		if (!this.#definedBehaviors.has(name)) {
			this.#definedBehaviors.set(name, Behavior)

			if (this.#whenDefinedPromises.has(name)) {
				this.#whenDefinedPromises.get(name)!.resolve()
				this.#whenDefinedPromises.delete(name)
			}
		} else {
			throw new Error(`Behavior ${name} is already defined.`)
		}
	}

	/** Get the behavior class associated with `name`. */
	get(name: string) {
		return this.#definedBehaviors.get(name)
	}

	/** Returns `true` if there's a class defined for the given `name`, `false` otherwise. */
	has(name: string) {
		return this.#definedBehaviors.has(name)
	}

	/**
	 * Wait for the promise returned by this to run code after a behavior class
	 * for the given `name` has been defined. If the behavior class is already
	 * defined, resolves immediately.
	 */
	whenDefined(name: string): Promise<void> {
		if (this.#whenDefinedPromises.has(name)) return this.#whenDefinedPromises.get(name)!.promise
		if (this.has(name)) return Promise.resolve()

		let resolve!: () => void
		const promise = new Promise<void>(r => (resolve = r))

		this.#whenDefinedPromises.set(name, {promise, resolve})

		return promise
	}
}

export let elementBehaviors: BehaviorRegistry

// Avoid errors trying to use DOM APIs in non-DOM environments (f.e. server-side rendering).
if (globalThis.window?.document) {
	elementBehaviors = globalThis.elementBehaviors = new BehaviorRegistry()
}

declare global {
	// const doesn't always work (TS bug). At time of writing this, it doesn't work in this TS playground example:
	// https://www.typescriptlang.org/play?#code/KYDwDg9gTgLgBAbzgXwFCoCbAMYBsCGUwcA5rhAEb66KpxzYQB2AzvAGYQQBccTArgFsKwKKjSoylagBUAFgEsWAOk4Q4Aeg1wAolCjQANHAXwYipgGsWcAAZrbJm0wjws7BU2AYgA
	// And discussions:
	// https://discord.com/channels/508357248330760243/508357248330760249/1019034094060978228
	// https://discord.com/channels/508357248330760243/1019017621397585961
	var elementBehaviors: BehaviorRegistry

	interface Window {
		elementBehaviors: BehaviorRegistry
	}
}

export type ElementBehaviors = {behaviors: BehaviorMap}

export type ElementWithBehaviors = Element & ElementBehaviors

export type PossibleBehaviorConstructor = Constructor<
	PossibleBehaviorInstance,
	[ElementWithBehaviors],
	{awaitElementDefined?: boolean; observedAttributes?: string[]}
>

export type PossibleBehaviorInstance = {
	connectedCallback?: (element: Element) => void
	disconnectedCallback?: (element: Element) => void
	attributeChangedCallback?: (attr: string, oldValue: string | null, newValue: string | null, element: Element) => void
	[k: string]: any
	[k: number]: any
}
