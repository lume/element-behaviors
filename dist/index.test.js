import { createEffect } from 'solid-js';
import './index.js';
import './tests-shared.js';
describe('element-behaviors', () => {
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
            createEffect(() => {
                const four = div.behaviors.get('four');
                const five = div.behaviors.get('five');
                const six = div.behaviors.get('six');
                if (!(four && five && six))
                    return;
                expect(four).toBeInstanceOf(Four);
                expect(five).toBeInstanceOf(Five);
                expect(six).toBeInstanceOf(Six);
                done();
            });
        });
    });
});
//# sourceMappingURL=index.test.js.map