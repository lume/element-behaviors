/** A registry of behaviors. Similar to CustomElementRegistry. */
export class BehaviorRegistry {
    #definedBehaviors = new Map();
    #whenDefinedPromises = new Map();
    /**
     * Associate a class `Behavior` to a given behavior `name`. Any time an
     * element has the named behavior, the given class will be instantiated and
     * the instance will be able to apply logic to its host element.
     */
    define(name, Behavior) {
        if (!this.#definedBehaviors.has(name)) {
            this.#definedBehaviors.set(name, Behavior);
            if (this.#whenDefinedPromises.has(name)) {
                this.#whenDefinedPromises.get(name).resolve();
                this.#whenDefinedPromises.delete(name);
            }
        }
        else {
            throw new Error(`Behavior ${name} is already defined.`);
        }
    }
    /** Get the behavior class associated with `name`. */
    get(name) {
        return this.#definedBehaviors.get(name);
    }
    /** Returns `true` if there's a class defined for the given `name`, `false` otherwise. */
    has(name) {
        return this.#definedBehaviors.has(name);
    }
    /**
     * Wait for the promise returned by this to run code after a behavior class
     * for the given `name` has been defined. If the behavior class is already
     * defined, resolves immediately.
     */
    whenDefined(name) {
        if (this.#whenDefinedPromises.has(name))
            return this.#whenDefinedPromises.get(name).promise;
        if (this.has(name))
            return Promise.resolve();
        let resolve;
        const promise = new Promise(r => (resolve = r));
        this.#whenDefinedPromises.set(name, { promise, resolve });
        return promise;
    }
}
export let elementBehaviors;
// Avoid errors trying to use DOM APIs in non-DOM environments (f.e. server-side rendering).
if (globalThis.window?.document) {
    elementBehaviors = globalThis.elementBehaviors = new BehaviorRegistry();
}
//# sourceMappingURL=BehaviorRegistry.js.map