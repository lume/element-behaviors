import type { Constructor } from 'lowclass/dist/Constructor.js';
import type { BehaviorMap } from './BehaviorMap.js';
/** A registry of behaviors. Similar to CustomElementRegistry. */
export declare class BehaviorRegistry {
    #private;
    /**
     * Associate a class `Behavior` to a given behavior `name`. Any time an
     * element has the named behavior, the given class will be instantiated and
     * the instance will be able to apply logic to its host element.
     */
    define<T extends PossibleBehaviorConstructor>(name: string, Behavior: T): void;
    /** Get the behavior class associated with `name`. */
    get(name: string): PossibleBehaviorConstructor | undefined;
    /** Returns `true` if there's a class defined for the given `name`, `false` otherwise. */
    has(name: string): boolean;
    /**
     * Wait for the promise returned by this to run code after a behavior class
     * for the given `name` has been defined. If the behavior class is already
     * defined, resolves immediately.
     */
    whenDefined(name: string): Promise<void>;
}
export declare let elementBehaviors: BehaviorRegistry;
declare global {
    var elementBehaviors: BehaviorRegistry;
    interface Window {
        elementBehaviors: BehaviorRegistry;
    }
}
export type ElementBehaviors = {
    behaviors: BehaviorMap;
};
export type ElementWithBehaviors = Element & ElementBehaviors;
export type PossibleBehaviorConstructor = Constructor<PossibleBehaviorInstance, [
    ElementWithBehaviors
], {
    awaitElementDefined?: boolean;
    observedAttributes?: string[];
}>;
export type PossibleBehaviorInstance = {
    connectedCallback?: (element: Element) => void;
    disconnectedCallback?: (element: Element) => void;
    attributeChangedCallback?: (attr: string, oldValue: string | null, newValue: string | null, element: Element) => void;
    [k: string]: any;
    [k: number]: any;
};
//# sourceMappingURL=BehaviorRegistry.d.ts.map