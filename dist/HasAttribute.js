var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a;
var _HasAttribute_skipConnectedCheck;
import '@lume/custom-attributes/dist/index.js';
import { CancelablePromise, PromiseCancellation } from './CancelablePromise.js';
import { BehaviorMap } from './BehaviorMap.js';
export class HasAttribute {
    constructor() {
        this.observers = new Map();
        this.elementDefinedPromises = new Map();
        this.isConnected = false;
        _HasAttribute_skipConnectedCheck.set(this, false);
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
        __classPrivateFieldSet(this, _HasAttribute_skipConnectedCheck, true, "f");
        this.changedCallback(this.value, '');
        __classPrivateFieldSet(this, _HasAttribute_skipConnectedCheck, false, "f");
    }
    changedCallback(oldVal, newVal) {
        if (!__classPrivateFieldGet(this, _HasAttribute_skipConnectedCheck, "f")) {
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
        var _a;
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
                (_a = behavior.connectedCallback) === null || _a === void 0 ? void 0 : _a.call(behavior, this.ownerElement);
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
        var _a;
        const promiseId = name + '_' + this.ownerElement.tagName;
        const promise = this.elementDefinedPromises.get(promiseId);
        if (promise) {
            promise.cancel();
            this.elementDefinedPromises.delete(promiseId);
        }
        const behavior = this.behaviors.get(name);
        if (!behavior)
            return;
        (_a = behavior.disconnectedCallback) === null || _a === void 0 ? void 0 : _a.call(behavior, this.ownerElement);
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
_HasAttribute_skipConnectedCheck = new WeakMap();
if ((_a = globalThis.window) === null || _a === void 0 ? void 0 : _a.document) {
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