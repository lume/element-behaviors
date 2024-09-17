import type { PossibleBehaviorInstance } from './BehaviorRegistry.js';
/**
 * A map of behavior names to their defined classes.
 *
 * Reactive in Solid.js.
 */
export declare class BehaviorMap extends Map<string, PossibleBehaviorInstance> {
    #private;
    find(predicate: (name: string, behavior: PossibleBehaviorInstance) => boolean): PossibleBehaviorInstance | undefined;
    get(key: string): PossibleBehaviorInstance | undefined;
    set(key: string, value: PossibleBehaviorInstance): this;
    delete(key: string): boolean;
    clear(): void;
    has(key: string): boolean;
    entries(): MapIterator<[string, PossibleBehaviorInstance]>;
    [Symbol.iterator](): MapIterator<[string, PossibleBehaviorInstance]>;
    forEach(callbackfn: (value: PossibleBehaviorInstance, key: string, map: Map<string, PossibleBehaviorInstance>) => void, thisArg?: any): void;
    keys(): MapIterator<string>;
    get size(): number;
    set size(n: number);
}
//# sourceMappingURL=BehaviorMap.d.ts.map