import {$TRACK} from 'solid-js'
import {createMutable, modifyMutable, reconcile} from 'solid-js/store'
import type {PossibleBehaviorInstance} from './BehaviorRegistry.js'

/**
 * A map of behavior names to their defined classes.
 *
 * Reactive in Solid.js.
 */

export class BehaviorMap extends Map<string, PossibleBehaviorInstance> {
	// We make things like element.behaviors.get('some-behavior') reactive (in
	// Solid.js), but a DOM-spec'd version of element-behaviors would not have
	// this, or it could have reactivity if it gets built into the JavaScript
	// language (people are talking about "signals and effects")
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

		// TODO Remove the set() method from end users, allow the user to add
		// behaviors in a fashion similar to classList.add().
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
