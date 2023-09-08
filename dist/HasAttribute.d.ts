import '@lume/custom-attributes/dist/index.js';
import type { CustomAttribute } from '@lume/custom-attributes/dist/index.js';
import { CancelablePromise } from './CancelablePromise.js';
import type { ElementWithBehaviors, PossibleBehaviorInstance } from './BehaviorRegistry.js';
import { BehaviorMap } from './BehaviorMap.js';
export declare class HasAttribute implements CustomAttribute {
    #private;
    ownerElement: ElementWithBehaviors;
    value: string;
    name: string;
    get behaviors(): BehaviorMap;
    observers: Map<PossibleBehaviorInstance, MutationObserver>;
    elementDefinedPromises: Map<string, CancelablePromise<CustomElementConstructor>>;
    isConnected: boolean;
    connectedCallback(): void;
    disconnectedCallback(): void;
    changedCallback(oldVal: string, newVal: string): void;
    private getBehaviorNames;
    private getDiff;
    private handleDiff;
    private connectBehavior;
    private disconnectBehavior;
    destroyAttributeObserver(behavior: PossibleBehaviorInstance): void;
    createAttributeObserver(behavior: PossibleBehaviorInstance): void;
    fireInitialAttributeChangedCallbacks(behavior: PossibleBehaviorInstance, attributes: string[]): void;
}
//# sourceMappingURL=HasAttribute.d.ts.map