export class BehaviorRegistry {
    #definedBehaviors = new Map();
    #whenDefinedPromises = new Map();
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
    get(name) {
        return this.#definedBehaviors.get(name);
    }
    has(name) {
        return this.#definedBehaviors.has(name);
    }
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
if (globalThis.window?.document) {
    elementBehaviors = globalThis.elementBehaviors = new BehaviorRegistry();
}
//# sourceMappingURL=BehaviorRegistry.js.map