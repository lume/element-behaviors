import { $TRACK } from 'solid-js';
import { createMutable, modifyMutable, reconcile } from 'solid-js/store';
export class BehaviorMap extends Map {
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
        this.#reactivityTriggerObject[key];
        return super.get(key);
    }
    set(key, value) {
        queueMicrotask(() => {
            this.#reactivityTriggerObject[key] = value;
        });
        super.set(key, value);
        return this;
    }
    delete(key) {
        queueMicrotask(() => {
            delete this.#reactivityTriggerObject[key];
        });
        return super.delete(key);
    }
    clear() {
        queueMicrotask(() => {
            modifyMutable(this.#reactivityTriggerObject, reconcile({}));
        });
        super.clear();
    }
    has(key) {
        this.#reactivityTriggerObject[key];
        return super.has(key);
    }
    entries() {
        this.#reactivityTriggerObject[$TRACK];
        return super.entries();
    }
    [Symbol.iterator]() {
        this.#reactivityTriggerObject[$TRACK];
        return super[Symbol.iterator]();
    }
    forEach(callbackfn, thisArg) {
        this.#reactivityTriggerObject[$TRACK];
        super.forEach(callbackfn, thisArg);
    }
    keys() {
        this.#reactivityTriggerObject[$TRACK];
        return super.keys();
    }
    get size() {
        this.#reactivityTriggerObject[$TRACK];
        return super.size;
    }
    set size(n) {
        super.size = n;
    }
}
//# sourceMappingURL=BehaviorMap.js.map