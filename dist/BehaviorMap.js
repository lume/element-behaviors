var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _BehaviorMap_reactivityTriggerObject;
import { $TRACK } from 'solid-js';
import { createMutable, modifyMutable, reconcile } from 'solid-js/store';
export class BehaviorMap extends Map {
    constructor() {
        super(...arguments);
        _BehaviorMap_reactivityTriggerObject.set(this, createMutable({}));
    }
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
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[key];
        return super.get(key);
    }
    set(key, value) {
        queueMicrotask(() => {
            __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[key] = value;
        });
        super.set(key, value);
        return this;
    }
    delete(key) {
        queueMicrotask(() => {
            delete __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[key];
        });
        return super.delete(key);
    }
    clear() {
        queueMicrotask(() => {
            modifyMutable(__classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f"), reconcile({}));
        });
        super.clear();
    }
    has(key) {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[key];
        return super.has(key);
    }
    entries() {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[$TRACK];
        return super.entries();
    }
    [(_BehaviorMap_reactivityTriggerObject = new WeakMap(), Symbol.iterator)]() {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[$TRACK];
        return super[Symbol.iterator]();
    }
    forEach(callbackfn, thisArg) {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[$TRACK];
        super.forEach(callbackfn, thisArg);
    }
    keys() {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[$TRACK];
        return super.keys();
    }
    get size() {
        __classPrivateFieldGet(this, _BehaviorMap_reactivityTriggerObject, "f")[$TRACK];
        return super.size;
    }
    set size(n) {
        super.size = n;
    }
}
//# sourceMappingURL=BehaviorMap.js.map