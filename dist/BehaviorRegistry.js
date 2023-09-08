var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a;
var _BehaviorRegistry_definedBehaviors, _BehaviorRegistry_whenDefinedPromises;
export class BehaviorRegistry {
    constructor() {
        _BehaviorRegistry_definedBehaviors.set(this, new Map());
        _BehaviorRegistry_whenDefinedPromises.set(this, new Map());
    }
    define(name, Behavior) {
        if (!__classPrivateFieldGet(this, _BehaviorRegistry_definedBehaviors, "f").has(name)) {
            __classPrivateFieldGet(this, _BehaviorRegistry_definedBehaviors, "f").set(name, Behavior);
            if (__classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").has(name)) {
                __classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").get(name).resolve();
                __classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").delete(name);
            }
        }
        else {
            throw new Error(`Behavior ${name} is already defined.`);
        }
    }
    get(name) {
        return __classPrivateFieldGet(this, _BehaviorRegistry_definedBehaviors, "f").get(name);
    }
    has(name) {
        return __classPrivateFieldGet(this, _BehaviorRegistry_definedBehaviors, "f").has(name);
    }
    whenDefined(name) {
        if (__classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").has(name))
            return __classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").get(name).promise;
        if (this.has(name))
            return Promise.resolve();
        let resolve;
        const promise = new Promise(r => (resolve = r));
        __classPrivateFieldGet(this, _BehaviorRegistry_whenDefinedPromises, "f").set(name, { promise, resolve });
        return promise;
    }
}
_BehaviorRegistry_definedBehaviors = new WeakMap(), _BehaviorRegistry_whenDefinedPromises = new WeakMap();
export let elementBehaviors;
if ((_a = globalThis.window) === null || _a === void 0 ? void 0 : _a.document) {
    elementBehaviors = globalThis.elementBehaviors = new BehaviorRegistry();
}
//# sourceMappingURL=BehaviorRegistry.js.map