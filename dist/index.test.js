import { createEffect } from 'solid-js';
import './index.js';
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
            static { this.observedAttributes = ['foo']; }
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
            static { this.observedAttributes = ['foo']; }
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
            expect(div.behaviors.has('one')).toEqual(true);
            expect(div.behaviors.has('two')).toEqual(false);
            expect(div.behaviors.has('three')).toEqual(true);
            document.body.innerHTML = '';
        });
    });
    describe('awaitElementDefined', () => {
        it('allows to prevent behaviors from being instantiated until custom elements are defined', async () => {
            let waitingBehaviorConnected = false;
            elementBehaviors.define('wait-for-element-defined', class WaitsForElementDefined {
                static { this.awaitElementDefined = true; }
                connectedCallback() {
                    waitingBehaviorConnected = true;
                }
            });
            let nonWaitingBehaviorConnected = false;
            elementBehaviors.define('does-not-wait', class DoesNotWait {
                static { this.awaitElementDefined = false; }
                connectedCallback() {
                    nonWaitingBehaviorConnected = true;
                }
            });
            document.body.innerHTML = `
				<some-element has="wait-for-element-defined does-not-wait"></some-element>
			`;
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toEqual(false);
            expect(nonWaitingBehaviorConnected).toEqual(true);
            customElements.define('some-element', class extends HTMLElement {
            });
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toEqual(true);
            expect(nonWaitingBehaviorConnected).toEqual(true);
        });
        it('does not instantiate a waiting behavior if the element is disconnected before definition', async () => {
            let waitingBehaviorConnected = false;
            elementBehaviors.define('wait-for-element-defined-2', class WaitsForElementDefined {
                static { this.awaitElementDefined = true; }
                connectedCallback() {
                    waitingBehaviorConnected = true;
                }
            });
            document.body.innerHTML = `
				<some-element-2 has="wait-for-element-defined-2"></some-element-2>
			`;
            const someEl = document.body.firstElementChild;
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toEqual(false);
            someEl.remove();
            customElements.define('some-element-2', class extends HTMLElement {
            });
            await new Promise(r => setTimeout(r));
            expect(waitingBehaviorConnected).toEqual(false);
        });
    });
    describe('.behaviors property', () => {
        it('allows accessing behavior instances on an element reactively', done => {
            class Four {
            }
            elementBehaviors.define('four', Four);
            class Five {
            }
            elementBehaviors.define('five', Five);
            class Six {
            }
            elementBehaviors.define('six', Six);
            document.body.innerHTML = `
				<div has="four five six"></div>
			`;
            const div = document.body.firstElementChild;
            let isDone = false;
            createEffect(() => {
                if (isDone)
                    return;
                const four = div.behaviors.get('four');
                const five = div.behaviors.get('five');
                const six = div.behaviors.get('six');
                if (!(four && five && six))
                    return;
                expect(four).toBeInstanceOf(Four);
                expect(five).toBeInstanceOf(Five);
                expect(six).toBeInstanceOf(Six);
                isDone = true;
                console.log('Reacted to behaviors after they exist.');
                done();
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map