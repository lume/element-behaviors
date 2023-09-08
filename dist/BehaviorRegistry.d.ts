import type { Constructor } from 'lowclass';
import type { BehaviorMap } from './BehaviorMap.js';
export declare class BehaviorRegistry {
    #private;
    define<T extends PossibleBehaviorConstructor>(name: string, Behavior: T): void;
    get(name: string): PossibleBehaviorConstructor | undefined;
    has(name: string): boolean;
    whenDefined(name: string): Promise<void>;
}
export declare let elementBehaviors: BehaviorRegistry;
declare global {
    var elementBehaviors: BehaviorRegistry;
    interface Window {
        elementBehaviors: BehaviorRegistry;
    }
}
export declare type ElementBehaviors = {
    behaviors: BehaviorMap;
};
export declare type ElementWithBehaviors = Element & ElementBehaviors;
export declare type PossibleBehaviorConstructor = Constructor<PossibleBehaviorInstance, [
    ElementWithBehaviors
], {
    awaitElementDefined?: boolean;
    observedAttributes?: string[];
}>;
export declare type PossibleBehaviorInstance = {
    connectedCallback?: (element: Element) => void;
    disconnectedCallback?: (element: Element) => void;
    attributeChangedCallback?: (attr: string, oldValue: string | null, newValue: string | null, element: Element) => void;
    [k: string]: any;
    [k: number]: any;
};
//# sourceMappingURL=BehaviorRegistry.d.ts.map