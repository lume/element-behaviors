describe('element-behaviors', () => {
    it('exposes the library globally', () => {
        expect(elementBehaviors).toBeInstanceOf(Object);
        expect(elementBehaviors.define).toBeInstanceOf(Function);
        expect(elementBehaviors.get).toBeInstanceOf(Function);
        expect(elementBehaviors.has).toBeInstanceOf(Function);
    });
    it('defines an element behavior', () => {
        class Foo {
            constructor() {
                this.foo = 'bar';
            }
        }
        elementBehaviors.define('foo', Foo);
        expect(elementBehaviors.has('foo')).toBe(true);
        expect(() => elementBehaviors.define('foo', Foo)).toThrow();
        const _Foo = elementBehaviors.get('foo');
        expect(_Foo).toBe(Foo);
    });
    it('similar lifecycle methods as custom elements', async () => {
        const div = document.createElement('div');
        div.setAttribute('foo', '0');
        let attrChangedCount = 0;
        const attrChangedArgs = [];
        let constructCount = 0;
        let connectedCount = 0;
        let disconnectedCount = 0;
        class Awesomeness {
            constructor(el) {
                this.el = el;
                constructCount++;
                expect(this.el).toBe(div);
            }
            connectedCallback(element) {
                connectedCount++;
                expect(element).toBe(this.el);
                expect(element).toBe(div);
            }
            disconnectedCallback(element) {
                disconnectedCount++;
                expect(element).toBe(this.el);
                expect(element).toBe(div);
            }
            attributeChangedCallback(attr, oldVal, newVal, element) {
                attrChangedCount++;
                attrChangedArgs.push(attr, oldVal, newVal);
                expect(element).toBe(this.el);
                expect(element).toBe(div);
            }
        }
        Awesomeness.observedAttributes = ['foo'];
        elementBehaviors.define('awesomeness', Awesomeness);
        document.body.append(div);
        div.setAttribute('has', 'awesomeness');
        await new Promise(r => setTimeout(r));
        expect(constructCount).toBe(1);
        expect(connectedCount).toBe(1);
        await new Promise(r => setTimeout(r));
        div.setAttribute('foo', '1');
        div.setAttribute('foo', '2');
        div.setAttribute('foo', '3');
        div.removeAttribute('foo');
        await new Promise(r => setTimeout(r));
        expect(attrChangedCount).toBe(5, 'expected attributeChangedCallback to be called 4 times');
        expect(attrChangedArgs).toEqual([
            'foo', null, '0',
            'foo', '0', '1',
            'foo', '1', '2',
            'foo', '2', '3',
            'foo', '3', null,
        ], 'expected attributeChangedCallback to be called with certain args each time');
        div.remove();
        await new Promise(r => setTimeout(r));
        expect(disconnectedCount).toBe(1, 'expected disconnectedCallback to be called once');
        document.body.append(div);
        await new Promise(r => setTimeout(r));
        expect(constructCount).toBe(2);
        expect(connectedCount).toBe(2);
        div.remove();
        await new Promise(r => setTimeout(r));
        expect(disconnectedCount).toBe(2, 'expected disconnectedCallback to be called again');
        document.body.append(div);
        await new Promise(r => setTimeout(r));
        expect(constructCount).toBe(3);
        expect(connectedCount).toBe(3);
        div.removeAttribute('has');
        await new Promise(r => setTimeout(r));
        expect(disconnectedCount).toBe(3, 'expected disconnectedCallback to be called again');
        div.setAttribute('has', 'awesomeness');
        await new Promise(r => setTimeout(r));
        expect(constructCount).toBe(4);
        expect(connectedCount).toBe(4);
    });
    it('works in shadow roots', async () => {
        const container = document.createElement('div');
        const root = container.attachShadow({ mode: 'open' });
        document.body.append(container);
        const div = document.createElement('div');
        div.setAttribute('foo', '0');
        let attrChangedCount = 0;
        const attrChangedArgs = [];
        let connectedCount = 0;
        let disconnectedCount = 0;
        class Shine {
            constructor(el) {
                this.el = el;
            }
            connectedCallback() {
                connectedCount++;
            }
            disconnectedCallback() {
                disconnectedCount++;
            }
            attributeChangedCallback(attr, oldVal, newVal) {
                attrChangedCount++;
                attrChangedArgs.push(attr, oldVal, newVal);
            }
        }
        Shine.observedAttributes = ['foo'];
        elementBehaviors.define('shine', Shine);
        root.append(div);
        div.setAttribute('has', 'shine');
        await new Promise(r => setTimeout(r));
        expect(connectedCount).toBe(1);
        await new Promise(r => setTimeout(r));
        div.setAttribute('foo', '1');
        div.setAttribute('foo', '2');
        div.setAttribute('foo', '3');
        div.removeAttribute('foo');
        await new Promise(r => setTimeout(r));
        expect(attrChangedCount).toBe(5, 'expected attributeChangedCallback to be called 4 times');
        expect(attrChangedArgs).toEqual([
            'foo', null, '0',
            'foo', '0', '1',
            'foo', '1', '2',
            'foo', '2', '3',
            'foo', '3', null,
        ], 'expected attributeChangedCallback to be called with certain args each time');
        div.remove();
        await new Promise(r => setTimeout(r));
        expect(disconnectedCount).toBe(1, 'expected disconnectedCallback to be called once');
    });
    describe('has="" attribute', () => {
        it('properly adds or removes behaviors when its value changes', async () => {
            class One {
            }
            elementBehaviors.define('one', One);
            class Two {
            }
            elementBehaviors.define('two', Two);
            class Three {
            }
            elementBehaviors.define('three', Three);
            document.body.innerHTML = `
				<div has="one two three"></div>
			`;
            const div = document.body.firstElementChild;
            await new Promise(r => setTimeout(r));
            expect(div.behaviors.size).toBe(3);
            div.setAttribute('has', 'one three');
            await new Promise(r => setTimeout(r));
            expect(div.behaviors.size).toBe(2);
            expect(div.behaviors.has('one')).toBeTrue();
            expect(div.behaviors.has('two')).toBeFalse();
            expect(div.behaviors.has('three')).toBeTrue();
            document.body.innerHTML = '';
        });
    });
    describe('awaitElementDefined', () => {
        it('allows to prevent behaviors from being instantiated until custom elements are defined', async () => {
            var _a, _b;
            let waitingBehaviorConnected = false;
            elementBehaviors.define('wait-for-element-defined', (_a = class WaitsForElementDefined {
                    connectedCallback() {
                        waitingBehaviorConnected = true;
                    }
                },
                _a.awaitElementDefined = true,
                _a));
            let nonWaitingBehaviorConnected = false;
            elementBehaviors.define('does-not-wait', (_b = class DoesNotWait {
                    connectedCallback() {
                        nonWaitingBehaviorConnected = true;
                    }
                },
                _b.awaitElementDefined = false,
                _b));
            document.body.innerHTML = `
				<some-element has="wait-for-element-defined does-not-wait"></some-element>
			`;
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toBeFalse();
            expect(nonWaitingBehaviorConnected).toBeTrue();
            customElements.define('some-element', class extends HTMLElement {
            });
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toBeTrue();
            expect(nonWaitingBehaviorConnected).toBeTrue();
        });
        it('does not instantiate a waiting behavior if the element is disconnected before definition', async () => {
            var _a;
            let waitingBehaviorConnected = false;
            elementBehaviors.define('wait-for-element-defined-2', (_a = class WaitsForElementDefined {
                    connectedCallback() {
                        waitingBehaviorConnected = true;
                    }
                },
                _a.awaitElementDefined = true,
                _a));
            document.body.innerHTML = `
				<some-element-2 has="wait-for-element-defined-2"></some-element-2>
			`;
            const someEl = document.body.firstElementChild;
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toBeFalse();
            someEl.remove();
            customElements.define('some-element-2', class extends HTMLElement {
            });
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toBeFalse();
        });
    });
});
export {};
//# sourceMappingURL=tests-shared.js.map