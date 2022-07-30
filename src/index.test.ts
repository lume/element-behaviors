import './index.js' // adds elementBehaviors to global
import './tests-shared.js'

import {createEffect} from 'solid-js'
import type {ElementWithBehaviors} from './index.js'

// This test is here, not tested with global tests because the createEffect
// otherwise seems to be from a duplicate solid-js lib during testing, hence is
// fails to be reactive.
// TODO update @lume/cli so that we can prevent duplicate solid-js libs.
describe('element-behaviors', () => {
	describe('.behaviors property', () => {
		it('allows accessing behavior instances on an element reactively', done => {
			class Four {}
			elementBehaviors.define('four', Four)

			class Five {}
			elementBehaviors.define('five', Five)

			class Six {}
			elementBehaviors.define('six', Six)

			document.body.innerHTML = /*html*/ `
				<div has="four five six"></div>
			`

			const div = document.body.firstElementChild as ElementWithBehaviors

			// .behaviors is reactive, useful in Solid effects
			createEffect(() => {
				const four = div.behaviors.get('four')
				const five = div.behaviors.get('five')
				const six = div.behaviors.get('six')

				if (!(four && five && six)) return

				expect(four).toBeInstanceOf(Four)
				expect(five).toBeInstanceOf(Five)
				expect(six).toBeInstanceOf(Six)

				done()
			})
		})
	})
})
