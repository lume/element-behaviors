# element-behaviors

Apply any number of functionalities ("behaviors") to an HTML element.

<h4><code><strong>npm install element-behaviors</strong></code></h4>

For a basic example, see this live pen: https://codepen.io/trusktr/pen/ymPXNb

Element behaviors are re-usable bits and pieces of logic that we can mix onto any HTML element.

To explain what "element behaviors" are, an analogy can be used: "element behaviors" are effectively
the same as "entity components" in an
[entity-component system (ECS)](https://en.wikipedia.org/wiki/Entity%E2%80%93component%E2%80%93system).

The term "element behaviors" works better with HTML elements because the word "components" is
already too widely adopted for things like Web Components, React Components, Vue Components, and
components of various other web-baesd view libraries. In those libraries, "component" means a
specific building-block that is used in a specific way and not mixed onto other entities, which is
not the same as the "components" in an entity-component system.

To disambiguate and not cause confusion, enter "element behaviors".

## Mix behaviors onto any elements

Element behaviors are useful for HTML elements in the same way that components are for entities in
entity-component systems: any number of behaviors ("components" in ECS) can be applied to a given
element ("entity" in ECS), and a specific behavior can be applied to any number elements.

Element behaviors have lifecycle methods that are named the same as with
[Custom Elements](https://developers.google.com/web/fundamentals/web-components/customelements) (be
sure to read about that first if you don't know). This let's us react to the lifecycle events of an
element just like the element itself can react to its own events.

## What for?

To help spark your imagination, this is what you might do with Element Behaviors:

```html
<!-- a Minecraft-like game -->
<ender-man has="player-aware holds-block" holds="dirt" position="30 30 30"></ender-man>

<!-- uh oh! The enderman is aware of the player, run!  -->
<play-er position="40 40 30"></play-er>
```

```html
<!-- ...the player got away from the enderman, and found diamond armor and a horse -->
<ender-man has="holds-block" holds="sand" position="-20 38 40"></ender-man>
<play-er has="diamond-armor horse-inventory" position="100 150 40"></play-er>
```

## How

To illustrate with a small example, let's suppose we want to add a behavior to a wide variety of
elements in an application, and that the behavior will simply log to the console whenever the
element is clicked.

Unlike Custom Elements that need to extend from HTMLElement, Element Behaviors do not need to extend
from any class, and unlike Custom Element lifecycle methods, Element Behavior methods all accept a
first argument `element` which is the element onto which the instance of the behavior is applied.

So, let's define the behavior:

```html
<script>
	// define an element behavior class
	class ClickLogger {
		constructor(element) {
			this.handler = () => {
				console.log('Clicked an element: ', element)
			}
		}

		// called when the `element` is added to the DOM
		connectedCallback(element) {
			element.addEventListener('click', this.handler)
		}

		// called when the `element` is removed from the DOM
		disconnectedCallback(element) {
			element.removeEventListener('click', this.handler)
		}
	}

	// define the behavior with the class
	elementBehaviors.define('click-logger', ClickLogger)
</script>
```

Then, we use the new `has=""` attribute to specify which behaviors any element has:

```html
<div has="click-logger">one</div>
<p has="click-logger">two</p>
<button has="click-logger">three</button>
```

That's all that we need to do! For each DOM element created that has the specified behavior, an
instance of the behavior will be constructed.

## API

The API is simple. If you know Custom Elements, then you basically know Element Behaviors.

### Behavior class

The following is a class showing the methods that are automatically called for a behavior instance
based on the lifecycle of the element that the behavior is added to. The first argument received by
each method is the element that has the behavior:

```js
class SomeBehavior {
	// called only once, given the element that the behavior is attached to
	constructor(element) {}

	// called any time the associated `element` is added to the DOM
	connectedCallback(element) {}

	// called any time the associated `element` is removed from the DOM
	disconnectedCallback(element) {}

	// as with custom elements, define which attributes of the associated element that the behavior reacts to
	static get observedAttributes() {
		return [
			/* ... */
		]
	}

	// called any time an observed attribute of the associated element has been changed
	attributeChangedCallback(element, attributeName, oldValue, newValue) {}

	// There is one additional API. If static awaitElementDefined is true, then
	// the behavior will not be insntiated and connected until its host element
	// (if it is a custom element with a hyphen in its name) is defined and
	// upgraded.
	static awaitElementDefined = true // Default is false.
}
```

### `elementBehaviors.define()`

Similar to `customElements`, `elementBehaviors` is a global with a `define()` method.

The first parameter accepts the name of the behavior (a string) that will be defined, and the second
parameter accepts the class (an instance of Function) that defines the functionality of the
behavior.

Define a behavior, by associating a behavior name with a class:

```js
elementBehaviors.define('some-behavior', SomeBehavior)
```

And now the behavior can be used.

### The `has=""` attribute

To use behaviors, the special `has=""` attribute is used on any elements to specify which behaviors
they have.

Apply a behavior to an element:

```html
<div has="some-behavior">one</div>
```

Any number of behaviors can be applied to an element. If we define three behaviors, "foo", "bar",
and "baz" using `elementBehaviors.define()`, we can apply all of them to an element as a
space-separated list in the `has` attribute:

```html
<script>
	class Foo {
		/* ... */
	}
	elementBehaviors.define('foo', Foo)

	class Bar {
		/* ... */
	}
	elementBehaviors.define('bar', Bar)

	class Baz {
		/* ... */
	}
	elementBehaviors.define('baz', Baz)
</script>

<div has="foo bar baz">one</div>
```

Behaviors can be added and removed from elements at any time. For example, suppose we want to remove
the "baz" behavior from the previous `div`, and add "click-logger":

```js
const div = document.querySelector('div')

div.setAttribute('has', 'foo bar click-logger')
```

The new value of the `has` attribute no longer has "baz" and now has "click-logger". The Baz
behavior will have its `disconnectedCallback()` method called for cleanup, while the a
`new ClickLogger` instance will be constructed and have its `connectedCallback()` method called.

> **Note**
> If you were to call `div.setAttribute('has', 'click-logger')` thinking that you were adding
> the "click-logger" behavior, you will have removed all three "foo", "bar", and "baz" behaviors
> because the new `has` attribute is `has="click-logger"`.

### `Element.prototype.behaviors`

All elements have a new `.behaviors` property that returns a map of strings to
behavior instances. This makes it easy to get a behavior from an element to
interact with its APIs as needed. For example:

```html
<div has="some-behavior"></div>

<script>
	// Get the element
	const el = document.querySelector('[has=some-behavior]')

	// Get the behavior from the element
	const behavior = el.behaviors.get('some-behavior')

	// do something with `behavior`
</script>
```

The `.behaviors` property is reactive using Solid.js APIs. It can be taken advantage of by first installing `solid-js`,

```sh
npm install solid-js
```

Then in your app:

```js
import {createEffect} from 'solid-js'

createEffect(() => {
	const behavior = el.behaviors.get('some-behavior') // reactive

	if (!behavior) return

	// Log the count any time it changes:

	// Assume in this example that behavior.count is also a reactive (signal) property:
	console.log(behavior.count) // reactive
})
```

### `DefaultBehaviors` (in LUME)

[LUME](https://lume.io) (a 3D HTML toolkit) uses Element Behaviors, and provides an
additional
[`DefaultBehaviors`](https://github.com/lume/lume/blob/v0.3.0-alpha.14/src/behaviors/DefaultBehaviors.ts)
mixin class that gives Custom Element classes the ability to define which
behaviors they ship with by
default, which is super handy!

To use it first install `lume`:

```sh
npm install lume
```

To define a Custom Element with default behaviors, it is done similarly to with `observedAttributes`:

```js
import {DefaultBehaviors} from 'lume/dist/behaviors/DefaultBehaviors.js'

class SomeElement extends DefaultBehaviors(HTMLElement) {
	// Define observed attributes
	static get observedAttributes() {
		return ['some-attribute', 'other-attribute']
	}

	// Define default behaviors that the element will have
	static get defaultBehaviors() {
		return ['some-behavior', 'click-logger']
	}
}
```

Additionally, the `static defaultBehaviors` property can return an object whose
key names are behavior names, and whose values are functions that return true or
false to determine if a default behavior should be initially added to the
element or not. The function will receive the element, as well as intial
behaviors that the element already has defined by the `has=""` attribute when
the element is created.

For example, suppose we have the following HTML:

<!-- prettier-ignore -->
```html
<my-el has="another-behavior"></my-el>
<my-el has="some-behavior"></my-el>
```

We define a Custom Element like:

```js
class MyEl extends DefaultBehaviors(HTMLElement) {
	static get defaultBehaviors() {
		return {
			'click-logger': (element, initialBehaviors) => {
				// For sake of example, suppose that if the element has
				// `another-behavior`, then we do not want it to have the `click-logger`
				// behavior:
				if (initialBehaviors.includes('another-behavior')) {
					return false
				}
				return true
			},
		}
	}
}

customElements.define('my-el', MyEl)
```

When the `my-el` elements are created, only the one without the `another-behavior` will have
`click-logger` added to it, so the resulting DOM will be as follows:

<!-- prettier-ignore -->
```html
<my-el has="another-behavior"></my-el>
<my-el has="some-behavior click-logger"></my-el>
```

## Notes

- See this [long issue](https://github.com/w3c/webcomponents/issues/509) on w3c's webcomponents repo,
  which led to [the issue](https://github.com/w3c/webcomponents/issues/662) where the idea for element-behaviors was born,
  with some ideas from this [other issue](https://github.com/w3c/webcomponents/issues/663) (thanks to
  all who helped to discuss the idea!).
- Uses [custom-attributes](https://github.com/lume/custom-attributes) (originally by @matthewp, forked in LUME) to
  implement the `has=""` attribute.

## Contributing

First install dependencies:

```sh
npm install
```

### Code

Source files are written in TypeScript, ending in `.ts`.

Please make sure your editor obeys the format rules in `.editorconfig`. There
are [Editorconfig](https://editorconfig.org) plugins for just about every text
editor out there. Also install a [Prettier](https://prettier.io) plugin for
your editor, and have it auto format on save. Tests will fail if the formatting
check does not pass.

### Development build mode

Run the package in dev mode (it will rebuild when files change):

```sh
npm run dev
```

This watches files and automatically incrementally rebuilds the project when any files in `src/`
have changed.

### Production build

To build the package for production, run

```sh
npm run build
```

### Testing

Any files ending with `.test.ts` anywhere in the `tests/` or `src/` folders are test
files that will be ran by [Karma](https://karma-runner.github.io), the test runner.

To run tests (which will both check code format and run unit tests):

```sh
npm test
```

To debug tests, we can open a visible [Electron](https://electronjs.org) window in which Karma is
running tests, and use Chrome's devtools for debugging (f.e. stepping through the test code). To do
so, run:

```sh
npm run test-debug
```

### Publishing a new version

When ready to publish a new version, run one of the following depending on which part of the version
number you want to increment (see [SemVer](https://semver.org/) for conventions around version
numbers).

```sh
npm run realease:patch
npm run realease:minor
npm run realease:major
```

Any of the three `release:*` scripts will:

- clean the project of any previous build output
- stash any changes in the repo
- build the project in production mode
- run the project's tests
- increment the version number (according to SemVer rules depending on if you choose patch, minor,
  or major)
- create a new commit containing the version number in the form "v1.2.3" as the message
- tag that commit with a git tag of the same name as the commit message
- publish the new version to NPM
- push the commit and the tag to GitHub
- and finally unstash any changes if there were any

> **Note**
> If something goes wrong (f.e. an error during the build or test process), fear
> not, the package will not be published. Fix the failing tests, and try again.

> **Note**
> After a failure, changes that were stashed will remain stashed.
