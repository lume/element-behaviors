import type {Constructor} from 'lowclass'
import type {BehaviorMap} from './BehaviorMap.js'

export const whenDefinedPromises: Map<string, Promise<void>> = new Map()

export class BehaviorRegistry {
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
