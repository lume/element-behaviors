import { $TRACK } from 'solid-js';
import { createMutable, modifyMutable, reconcile } from 'solid-js/store';
/**
 * A map of behavior names to their defined classes.
 *
 * Reactive in Solid.js.
 */
export class BehaviorMap extends Map {
    // We make things like element.behaviors.get('some-behavior') reactive (in
    // Solid.js), but a DOM-spec'd version of element-behaviors would not have
    // this, or it could have reactivity if it gets built into the JavaScript
    // language (people are talking about "signals and effects")
    #reactivityTriggerObject = createMutable({});
    find(predicate) {
        let result = void undefined;
        for (const [name, behavior] of this) {
            if (!predicate(name, behavior))
                continue;
            result = behavior;
            break;
        }
        return result;
    }
    get(key) {
        // read, causes tracking in Solid.js effects.
        this.#reactivityTriggerObject[key];
        return super.get(key);
    }
    set(key, value) {
        queueMicrotask(() => {
            // write, triggers Solid.js effects
            this.#reactivityTriggerObject[key] = value;
        });
        // TODO Remove the set() method from end users, allow the user to add
        // behaviors in a fashion similar to classList.add().
        super.set(key, value);
        return this;
    }
    delete(key) {
        queueMicrotask(() => {
            // write, triggers Solid.js effects
            delete this.#reactivityTriggerObject[key];
        });
        return super.delete(key);
    }
    clear() {
        queueMicrotask(() => {
            // delete all properties, trigger single Solid.js effect update
            modifyMutable(this.#reactivityTriggerObject, reconcile({}));
        });
        super.clear();
    }
    has(key) {
        // read, causes tracking in Solid.js effects.
        // (TODO `in` operator not reactive yet, https://github.com/solidjs/solid/issues/1107)
        // key in this.#reactivityTriggerObject
        // Workaround, read the property
        this.#reactivityTriggerObject[key];
        return super.has(key);
    }
    entries() {
        // track all properties in a Solid effect
        // @ts-expect-error
        this.#reactivityTriggerObject[$TRACK];
        return super.entries();
    }
    [Symbol.iterator]() {
        // track all properties in a Solid effect
        // @ts-expect-error
        this.#reactivityTriggerObject[$TRACK];
        return super[Symbol.iterator]();
    }
    forEach(callbackfn, thisArg) {
        // track all properties in a Solid effect
        // @ts-expect-error
        this.#reactivityTriggerObject[$TRACK];
        super.forEach(callbackfn, thisArg);
    }
    keys() {
        // track all properties in a Solid effect
        // @ts-expect-error
        this.#reactivityTriggerObject[$TRACK];
        return super.keys();
    }
    get size() {
        // track all properties in a Solid effect
        // @ts-expect-error
        this.#reactivityTriggerObject[$TRACK];
        return super.size;
    }
    set size(n) {
        // @ts-expect-error readonly property according to TS, but in JS it is
        // assignable though nothing happens. We need this so that the property
        // behaves the same after we override it.
        super.size = n;
    }
}
//# sourceMappingURL=BehaviorMap.js.map