import '@lume/custom-attributes/dist/index.js';
import { CancelablePromise, PromiseCancellation } from './CancelablePromise.js';
import { BehaviorMap } from './BehaviorMap.js';
export class HasAttribute {
    constructor() {
        this.observers = new Map();
        this.elementDefinedPromises = new Map();
        this.isConnected = false;
        this.#skipConnectedCheck = false;
    }
    get behaviors() {
        return this.ownerElement.behaviors;
    }
    connectedCallback() {
        this.isConnected = true;
        this.changedCallback('', this.value);
    }
    disconnectedCallback() {
        this.isConnected = false;
        this.#skipConnectedCheck = true;
        this.changedCallback(this.value, '');
        this.#skipConnectedCheck = false;
    }
    #skipConnectedCheck;
    changedCallback(oldVal, newVal) {
        if (!this.#skipConnectedCheck) {
            if (!this.isConnected)
                return;
        }
        const currentBehaviors = this.getBehaviorNames(newVal);
        const previousBehaviors = this.getBehaviorNames(oldVal);
        if (currentBehaviors.length == 0 && previousBehaviors.length == 0)
            return;
        const { removed, added } = this.getDiff(previousBehaviors, currentBehaviors);
        this.handleDiff(removed, added);
    }
    getBehaviorNames(string) {
        if (string.trim() == '')
            return [];
        else
            return string.split(/\s+/);
    }
    getDiff(previousBehaviors, currentBehaviors) {
        const diff = {
            removed: [],
            added: currentBehaviors,
        };
        for (let i = 0, l = previousBehaviors.length; i < l; i += 1) {
            const oldBehavior = previousBehaviors[i];
            if (!diff.added.includes(oldBehavior)) {
                diff.removed.push(oldBehavior);
            }
            else {
                diff.added.splice(diff.added.indexOf(oldBehavior), 1);
            }
        }
        return diff;
    }
    handleDiff(removed, added) {
        for (const name of removed)
            this.disconnectBehavior(name);
        for (const name of added)
            this.connectBehavior(name);
    }
    async connectBehavior(name) {
        let Behavior = elementBehaviors.get(name);
        if (!Behavior) {
            await elementBehaviors.whenDefined(name);
            Behavior = elementBehaviors.get(name);
        }
        const observedAttributes = Behavior.observedAttributes;
        const tagName = this.ownerElement.tagName;
        try {
            if (Behavior.awaitElementDefined && tagName.includes('-') && !customElements.get(tagName.toLowerCase())) {
                const promiseId = name + '_' + tagName;
                let promise = this.elementDefinedPromises.get(promiseId);
                if (!promise) {
                    promise = new CancelablePromise(customElements.whenDefined(tagName.toLowerCase()), {
                        rejectOnCancel: true,
                    });
                    this.elementDefinedPromises.set(promiseId, promise);
                }
                await promise;
                this.elementDefinedPromises.delete(promiseId);
            }
            if (this.isConnected) {
                const behavior = new Behavior(this.ownerElement);
                this.behaviors.set(name, behavior);
                behavior.connectedCallback?.(this.ownerElement);
                if (Array.isArray(observedAttributes) && observedAttributes.length) {
                    this.fireInitialAttributeChangedCallbacks(behavior, observedAttributes);
                    this.createAttributeObserver(behavior);
                }
            }
        }
        catch (e) {
            if (!(e instanceof PromiseCancellation))
                throw e;
        }
    }
    disconnectBehavior(name) {
        const promiseId = name + '_' + this.ownerElement.tagName;
        const promise = this.elementDefinedPromises.get(promiseId);
        if (promise) {
            promise.cancel();
            this.elementDefinedPromises.delete(promiseId);
        }
        const behavior = this.behaviors.get(name);
        if (!behavior)
            return;
        behavior.disconnectedCallback?.(this.ownerElement);
        this.destroyAttributeObserver(behavior);
        this.behaviors.delete(name);
    }
    destroyAttributeObserver(behavior) {
        const observer = this.observers.get(behavior);
        if (!observer)
            return;
        observer.disconnect();
        this.observers.delete(behavior);
    }
    createAttributeObserver(behavior) {
        const el = this.ownerElement;
        const observer = new MutationObserver(records => {
            if (!behavior.attributeChangedCallback)
                return;
            let lastAttributeValues = {};
            let name = '';
            for (const record of records) {
                if (record.type !== 'attributes')
                    continue;
                name = record.attributeName;
                if (lastAttributeValues[name] === undefined) {
                    lastAttributeValues[name] = record.oldValue;
                    continue;
                }
                behavior.attributeChangedCallback(name, lastAttributeValues[name], record.oldValue, this.ownerElement);
                lastAttributeValues[name] = record.oldValue;
            }
            let attr;
            for (const name in lastAttributeValues) {
                attr = el.attributes.getNamedItem(name);
                behavior.attributeChangedCallback(name, lastAttributeValues[name], attr === null ? null : attr.value, this.ownerElement);
            }
        });
        observer.observe(el, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: behavior.constructor.observedAttributes,
        });
        this.observers.set(behavior, observer);
    }
    fireInitialAttributeChangedCallbacks(behavior, attributes) {
        if (!behavior.attributeChangedCallback)
            return;
        for (const name of attributes) {
            if (this.ownerElement.hasAttribute(name))
                behavior.attributeChangedCallback(name, null, this.ownerElement.attributes.getNamedItem(name).value, this.ownerElement);
        }
    }
}
if (globalThis.window?.document) {
    const behaviorMaps = new WeakMap();
    Object.defineProperty(Element.prototype, 'behaviors', {
        get() {
            let behaviorMap = null;
            if (behaviorMaps.has(this)) {
                behaviorMap = behaviorMaps.get(this);
            }
            else {
                behaviorMaps.set(this, (behaviorMap = new BehaviorMap()));
            }
            return behaviorMap;
        },
    });
    const _attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (options) {
        const root = _attachShadow.call(this, options);
        root.customAttributes.define('has', HasAttribute);
        return root;
    };
    globalThis.customAttributes.define('has', HasAttribute);
}
//# sourceMappingURL=HasAttribute.js.map