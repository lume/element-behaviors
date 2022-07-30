import type {ElementWithBehaviors} from './index.js'

describe('element-behaviors', () => {
	it('exposes the library globally', () => {
		expect(elementBehaviors).toBeInstanceOf(Object)
		expect(elementBehaviors.define).toBeInstanceOf(Function)
		expect(elementBehaviors.get).toBeInstanceOf(Function)
		expect(elementBehaviors.has).toBeInstanceOf(Function)
	})

	it('defines an element behavior', () => {
		class Foo {
			foo = 'bar'
		}

		elementBehaviors.define('foo', Foo)
		expect(elementBehaviors.has('foo')).toBe(true)

		// disallows duplicates
		expect(() => elementBehaviors.define('foo', Foo)).toThrow()

		const _Foo = elementBehaviors.get('foo')
		expect(_Foo).toBe(Foo)
	})

	it('similar lifecycle methods as custom elements', async () => {
		const div = document.createElement('div')

		div.setAttribute('foo', '0')

		let attrChangedCount = 0
		const attrChangedArgs: any[] = []
		let constructCount = 0
		let connectedCount = 0
		let disconnectedCount = 0

		class Awesomeness {
			constructor(public el: Element) {
				constructCount++
				expect(this.el).toBe(div)
			}

			static observedAttributes = ['foo']

			connectedCallback(element: Element) {
				connectedCount++
				expect(element).toBe(this.el)
				expect(element).toBe(div)
			}

			disconnectedCallback(element: Element) {
				disconnectedCount++
				expect(element).toBe(this.el)
				expect(element).toBe(div)
			}

			attributeChangedCallback(attr: string, oldVal: string | null, newVal: string | null, element: Element) {
				attrChangedCount++
				attrChangedArgs.push(attr, oldVal, newVal)
				expect(element).toBe(this.el)
				expect(element).toBe(div)
			}
		}

		elementBehaviors.define('awesomeness', Awesomeness)

		document.body.append(div)

		// give the div element awesomeness
		div.setAttribute('has', 'awesomeness')

		// TODO try similar things with Custom Elements, and see if they need or
		// don't need similar setTimeout deferrals, and make sure
		// element-behaviors follows the same behavior.

		await new Promise(r => setTimeout(r))

		expect(constructCount).toBe(1)
		expect(connectedCount).toBe(1)

		await new Promise(r => setTimeout(r))

		div.setAttribute('foo', '1')
		div.setAttribute('foo', '2')
		div.setAttribute('foo', '3')
		div.removeAttribute('foo')

		await new Promise(r => setTimeout(r))

		expect(attrChangedCount).toBe(5, 'expected attributeChangedCallback to be called 4 times')
		// prettier-ignore
		expect(attrChangedArgs).toEqual([
			'foo', null, '0',
			'foo', '0', '1',
			'foo', '1', '2',
			'foo', '2', '3',
			'foo', '3', null,
		], 'expected attributeChangedCallback to be called with certain args each time')

		div.remove()

		await new Promise(r => setTimeout(r))

		expect(disconnectedCount).toBe(1, 'expected disconnectedCallback to be called once')

		document.body.append(div)

		await new Promise(r => setTimeout(r))

		expect(constructCount).toBe(2)
		expect(connectedCount).toBe(2)

		div.remove()

		await new Promise(r => setTimeout(r))

		expect(disconnectedCount).toBe(2, 'expected disconnectedCallback to be called again')

		document.body.append(div)

		await new Promise(r => setTimeout(r))

		expect(constructCount).toBe(3)
		expect(connectedCount).toBe(3)

		div.removeAttribute('has')

		await new Promise(r => setTimeout(r))

		expect(disconnectedCount).toBe(3, 'expected disconnectedCallback to be called again')

		div.setAttribute('has', 'awesomeness')

		await new Promise(r => setTimeout(r))

		expect(constructCount).toBe(4)
		expect(connectedCount).toBe(4)
	})

	it('works in shadow roots', async () => {
		const container = document.createElement('div')

		const root = container.attachShadow({mode: 'open'})

		document.body.append(container)

		const div = document.createElement('div')

		div.setAttribute('foo', '0')

		let attrChangedCount = 0
		const attrChangedArgs: any[] = []
		let connectedCount = 0
		let disconnectedCount = 0

		class Shine {
			constructor(public el: Element) {}

			static observedAttributes = ['foo']

			connectedCallback() {
				connectedCount++
			}

			disconnectedCallback() {
				disconnectedCount++
			}

			attributeChangedCallback(attr: string, oldVal: string | null, newVal: string | null) {
				attrChangedCount++
				attrChangedArgs.push(attr, oldVal, newVal)
			}
		}

		elementBehaviors.define('shine', Shine)

		root.append(div)

		// give the div element shine
		div.setAttribute('has', 'shine')

		// TODO try similar things with Custom Elements, and see if they need or
		// don't need similar setTimeout deferrals, and make sure
		// element-behaviors follows the same behavior.

		await new Promise(r => setTimeout(r))

		expect(connectedCount).toBe(1)

		await new Promise(r => setTimeout(r))

		div.setAttribute('foo', '1')
		div.setAttribute('foo', '2')
		div.setAttribute('foo', '3')
		div.removeAttribute('foo')

		await new Promise(r => setTimeout(r))

		expect(attrChangedCount).toBe(5, 'expected attributeChangedCallback to be called 4 times')
		// prettier-ignore
		expect(attrChangedArgs).toEqual([
			'foo', null, '0',
			'foo', '0', '1',
			'foo', '1', '2',
			'foo', '2', '3',
			'foo', '3', null,
		], 'expected attributeChangedCallback to be called with certain args each time')

		div.remove()

		await new Promise(r => setTimeout(r))

		expect(disconnectedCount).toBe(1, 'expected disconnectedCallback to be called once')
	})

	describe('has="" attribute', () => {
		it('properly adds or removes behaviors when its value changes', async () => {
			class One {}
			elementBehaviors.define('one', One)

			class Two {}
			elementBehaviors.define('two', Two)

			class Three {}
			elementBehaviors.define('three', Three)

			document.body.innerHTML = /*html*/ `
				<div has="one two three"></div>
			`

			const div = document.body.firstElementChild as ElementWithBehaviors

			// Defer so that MutationObserver has a chance to fire first.
			await new Promise(r => setTimeout(r))

			expect(div!.behaviors.size).toBe(3)

			div.setAttribute('has', 'one three')

			// Defer so that MutationObserver has a chance to fire first.
			await new Promise(r => setTimeout(r))

			expect(div!.behaviors.size).toBe(2)
			expect(div!.behaviors.has('one')).toBeTrue()
			expect(div!.behaviors.has('two')).toBeFalse()
			expect(div!.behaviors.has('three')).toBeTrue()

			document.body.innerHTML = ''
		})
	})

	describe('awaitElementDefined', () => {
		it('allows to prevent behaviors from being instantiated until custom elements are defined', async () => {
			let waitingBehaviorConnected = false

			elementBehaviors.define(
				'wait-for-element-defined',
				class WaitsForElementDefined {
					static awaitElementDefined = true

					connectedCallback() {
						waitingBehaviorConnected = true
					}
				},
			)

			let nonWaitingBehaviorConnected = false

			elementBehaviors.define(
				'does-not-wait',
				class DoesNotWait {
					static awaitElementDefined = false // This is the default

					connectedCallback() {
						nonWaitingBehaviorConnected = true
					}
				},
			)

			document.body.innerHTML = /*html*/ `
				<some-element has="wait-for-element-defined does-not-wait"></some-element>
			`

			await new Promise(r => setTimeout(r)) // wait for MutationObservers

			expect(waitingBehaviorConnected).toBeFalse()
			expect(nonWaitingBehaviorConnected).toBeTrue()

			customElements.define('some-element', class extends HTMLElement {})

			await new Promise(r => setTimeout(r)) // wait for MutationObservers

			expect(waitingBehaviorConnected).toBeTrue()
			expect(nonWaitingBehaviorConnected).toBeTrue()
		})

		it('does not instantiate a waiting behavior if the element is disconnected before definition', async () => {
			let waitingBehaviorConnected = false

			elementBehaviors.define(
				'wait-for-element-defined-2',
				class WaitsForElementDefined {
					static awaitElementDefined = true

					connectedCallback() {
						waitingBehaviorConnected = true
					}
				},
			)

			document.body.innerHTML = /*html*/ `
				<some-element-2 has="wait-for-element-defined-2"></some-element-2>
			`

			const someEl = document.body.firstElementChild!

			await new Promise(r => setTimeout(r)) // wait for MutationObservers

			expect(waitingBehaviorConnected).toBeFalse()

			// remove before defining
			someEl.remove()
			customElements.define('some-element-2', class extends HTMLElement {})

			await new Promise(r => setTimeout(r)) // wait for MutationObservers

			// behavior will not erroneously be connected after awaiting the element definition
			expect(waitingBehaviorConnected).toBeFalse()
		})
	})
})
