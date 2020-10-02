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
		let connectedCount = 0
		let disconnectedCount = 0

		class Awesomeness {
			constructor(public el: Element) {
				expect(this.el).toBe(div)
			}

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

		elementBehaviors.define('awesomeness', Awesomeness)

		document.body.append(div)

		// give the div element awesomeness
		div.setAttribute('has', 'awesomeness')

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
})
