# element-behaviors

Element behaviors are re-usable bits and pieces of logic that we can mix onto any HTML element. We can apply any number of functionalities ("behaviors") to an HTML element.

<h4><code><strong>npm install element-behaviors</strong></code></h4>

The next Sparkles demo on CodePen shows how to apply a behavior to multiple elements:

https://codepen.io/trusktr/pen/MWzzNdV?editors=1000

https://github.com/lume/element-behaviors/assets/297678/0289f294-e5ff-4b7c-b30a-61e29aabea51

# Apply one or more behaviors onto HTML elements

Element behaviors are useful for assigning features onto HTML elements. They are similar to [Custom Elements](https://developers.google.com/web/fundamentals/web-components/customelements), but multiple behaviors can be associated with an element.

Element behaviors have lifecycle methods that are named the same as with
Custom Elements. This let's us react to the lifecycle events of an
element just like a custom element can.

To help spark your imagination, this is what you might do with Element
Behaviors. Suppose we are making a Minecraft-like game:

```html
<ender-man has="player-aware holds-block" holds="dirt" position="30 30 30"></ender-man>

<!-- uh oh! The enderman is aware of the player, run!...  -->
<play-er position="40 40 30"></play-er>
```

```html
<!-- ...the player got away from the enderman, and found diamond armor and a horse -->
<ender-man has="holds-block" holds="sand" position="-20 38 40"></ender-man>
<play-er has="diamond-helmet diamond-footwear horse" position="100 150 40"></play-er>
```

# How

To illustrate with a small example, let's suppose we want to add a behavior to a
wide variety of elements in an application, and that the behavior will simply
log to the console whenever the element is clicked.

Unlike Custom Elements that need to extend from `HTMLElement`, Element Behaviors
do not need to extend from any class. Similar to but unlike Custom Element
lifecycle methods, Element Behavior lifecycle methods all accept a first
argument `element` which is the element onto which the instance of the behavior
is applied.

Let's define a `ClickLogger` behavior:

```html
<script>
	// First define an element behavior class.
	class ClickLogger {
		// The constructor accepts the `element` in its first parameter.
		constructor(element) {
			this.handler = () => {
				console.log('Clicked an element: ', element)
			}
		}

		// This is called when the `element` is added to the DOM, passed in the `element`.
		connectedCallback(element) {
			// Here we create a click handler.
			element.addEventListener('click', this.handler)
		}

		// This is called when the `element` is removed from the DOM, passed in the `element`.
		disconnectedCallback(element) {
			// Don't forget to clean up!
			element.removeEventListener('click', this.handler)
		}
	}

	// Define the behavior with our class.
	elementBehaviors.define('click-logger', ClickLogger)
</script>
```

Now we can use the `has=""` attribute to specify which behaviors an element has,
and in this case we'll give multiple elements the `click-logger` behavior:

```html
<div has="click-logger">one</div>
<p has="click-logger">two</p>
<button has="click-logger">three</button>
```

That's all that we need to do! For each DOM element created that has the specified behavior, an
instance of the behavior will be constructed, and will log to console any time the elements are clicked.

An example of that is in [`examples/clicks/`](./examples/clicks/index.html).

# Examples

For a basic example, see this live pen: https://codepen.io/trusktr/pen/ymPXNb

To run local examples like the previous `ClickLogger` after cloning this repository, run

```sh
npm install
npm run examples
```

This opens a tab in your browser. Then, for example, click on the `clicks/`
folder to see the [`examples/clicks/index.html`](./examples/clicks/index.html)
file in action.

# Alternative to Custom Elements for special cases

Element Behaviors can be used as an alternative to Custom Elements, especially in cases where Custom Elements cannot be used at all.

For example, Custom Elements do not work with SVG because Custom Elements cannot
extend from `SVGElement`, and special `HTMLElement`s like `<table>` and `<tr>`
can not be extended by Custom Elements in all browsers (Safari does not support
the `is=""` attribute, i.e. "customized built-ins").

This is where Element Behaviors are advantageous: they do not need to extend
from any base class, and one or more behaviors can be used on any type of
elements, whether they are SVG, table elements, etc:

```html
<table has="click-logger">
	<tr has="coolness awesomeness">
		...
	</tr>
</table>
<svg has="some-behavior">
	<rect has="other-behavior"></rect>
</svg>
```

This works great for progressive enhancement where `<svg>` and `<table>`
elements will work fine without JavaScript (or prior to JavaScript being
loaded), and Element Behaviors can augment the elements when JavaScript is
available.

# API

The API is simple. If you know Custom Elements, then you basically know Element Behaviors.

## Behavior classes

The following is a class showing the APIs that a behavior class can have, in a
fashion similar to Custom Elements, with an additional `static awaitElementDefined` property. The first argument received by each lifecycle
method is the `element` that has the behavior on it:

```js
class SomeBehavior {
	// This is called only once, given the `element` that the behavior is attached to.
	constructor(element) {}

	// This is called any time the associated `element` is appended into the
	// DOM, passed in the `element`
	connectedCallback(element) {}

	// This is called any time the associated `element` is removed from the DOM,
	// passed in the `element`.
	disconnectedCallback(element) {}

	// As with custom elements, define which attributes of the associated
	// element that the behavior should react to.
	static observedAttributes = ['some-attribute', 'other-attribute']

	// This is called any time any of the `observedAttributes` of the associated
	// element have been changed, just like with Custom Elements but with the
	// additional passed in `element`.
	attributeChangedCallback(attributeName, oldValue, newValue, element) {}

	// There is one additional API, unlike with Custom Elements. If `static
	// awaitElementDefined` is `true`, then the behavior will not be
	// instantiated and connected until its host element is defined and upgraded
	// (that is, if the host element is possibly a custom element, having a
	// hyphen in its name). If the host element has no hyphen in its name, then
	// this does not apply, and the behavior will be created and connected
	// immediately without waiting. If a possibly-custom element is removed
	// before it is defined, then a behavior will not be created and connected
	// at all (waiting will have been canceled).
	static awaitElementDefined = true // Default is false.
}
```

## `elementBehaviors.define()`

Similar to `customElements`, `elementBehaviors` is a global with a `define()` method.

The first parameter accepts the name of the behavior (a string) that will be defined, and the second
parameter accepts the class (an instance of Function) that defines the functionality of the
behavior.

Define a behavior, by associating a behavior name with a class:

```js
class SomeBehavior {
	/* ... */
}

elementBehaviors.define('some-behavior', SomeBehavior)
```

And now the behavior can be used.

## The `has=""` attribute

To use behaviors, the special `has=""` attribute is used on desired elements to specify which behaviors
they should have.

Apply a behavior to an element:

```html
<div has="some-behavior">one</div>
```

Any number of behaviors can be applied to an element. If we define three behaviors, "foo", "bar",
and "baz" using `elementBehaviors.define()`, we can apply all of them to an element as a
space-separated list in the element's `has` attribute:

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

Behaviors can be added and removed from elements at any time. For example,
suppose we want to remove the "baz" behavior from the previous `div`, and add
"click-logger". We can do so by changing the value of the `has=""` attribute:

```js
const div = document.querySelector('div')

div.setAttribute('has', 'foo bar click-logger')
```

The new value of the `has` attribute no longer has "baz" and now has
"click-logger". The `Baz` behavior will have its `disconnectedCallback()` method
called for cleanup, while a `new ClickLogger` instance will be constructed and
have its `connectedCallback()` method called.

> **Note**
> If you were to call `div.setAttribute('has', 'click-logger')` thinking that you
> were adding the `click-logger` behavior, you will have removed all three `foo`,
> `bar`, and `baz` behaviors and the element will have only a `click-logger`
> behavior because the new `has` attribute is `has="click-logger"`.

## `Element.prototype.behaviors`

All elements have a new `.behaviors` property that returns a map of strings to
behavior instances. This makes it easy to get a behavior instance from an element to
interact with its APIs as needed. For example:

```html
<div has="some-behavior"></div>

<script>
	// Get the element
	const el = document.querySelector('[has=some-behavior]')

	// Get the behavior from the element
	const behavior = el.behaviors.get('some-behavior')

	// do something with `behavior`

	// Map.forEach
	el.behaviors.forEach((behavior, behaviorName) => {
		console.log('behavior:', behaviorName, behavior)
	})

	// It is iterable.
	for (const [behaviorName, behavior] of el.behaviors) {
		console.log('behavior:', behaviorName, behavior)
	}
</script>
```

# Notes

- See this [long issue](https://github.com/w3c/webcomponents/issues/509) on w3c's webcomponents repo,
  which led to [the issue](https://github.com/w3c/webcomponents/issues/662) where the idea for element-behaviors was born,
  with some ideas from this [other issue](https://github.com/w3c/webcomponents/issues/663) (thanks to
  all who helped to discuss the idea!).
- Uses [custom-attributes](https://github.com/lume/custom-attributes) (originally by @matthewp, forked
  in [LUME](https://lume.io)) to implement the `has=""` attribute.

---

# Extras (spec and proposal authors can stop reading here)

The rest of the document adds features that wouldn't be implementable in a real "element behaviors" (or similar) spec because the web platform does not support the following extras:

## TypeScript

If you are using Solid JSX (f.e. with `@lume/element` or `solid-js` packages)
you will want to import the `has=""` attribute type for use in your JSX
templates:

```tsx
import type {} from 'element-behaviors/src/attribute-types.solid'

export function SomeComponent() {
  return <div has="foo bar" ...></div> // no error
}

export function OtherComponent() {
  return <div has={123} ...></div> // error, value should be a string
}
```

> **Note** Other types for React JSX, Preact JSX, Svelte templates, Vue
> templates, etc, are not yet supported but easy to add. Open an issue or PR as
> needed.

## Solid.js Reactivity

The `el.behaviors` property is reactive using [Solid.js](https://www.solidjs.com)
APIs, meaning we can react to changes in behaviors.

This can be taken advantage of by first installing `solid-js`,

```sh
npm install solid-js
```

Then in your app you can use `el.behaviors` APIs in a reactive context such as a
JSX template, or in an effect:

```js
import {createEffect} from 'solid-js'

// This effect will re-run any time the values of
// `el.behaviors.get('some-behavior')` or `behavior.count` change.
createEffect(() => {
	const behavior = el.behaviors.get('some-behavior') // reactive

	if (!behavior) return

	// Log the count any time it changes:

	// Assume in this example that behavior.count is a reactive (signal) property made with Solid.js:
	console.log(behavior.count) // reactive
})
```

# Contributing

First install dependencies:

```sh
npm install
```

## Code

Source files are written in TypeScript, ending in `.ts`.

Please make sure your editor obeys the format rules in `.editorconfig`. There
are [Editorconfig](https://editorconfig.org) plugins for just about every text
editor out there. Also install a [Prettier](https://prettier.io) plugin for
your editor, and have it auto format on save. Tests will fail if the formatting
check does not pass.

## Development build mode

Run the package in dev mode (it will rebuild when files change):

```sh
npm run dev
```

This watches files and automatically incrementally rebuilds the project when any files in `src/`
have changed.

## Production build

To build the package for production, run

```sh
npm run build
```

## Testing

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

## Publishing a new version

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

# TODO

- TypeScript example with `solid-js`
- TypeScript example with `@lume/element`
- TypeScript example with `react`
- TypeScript example with `preact`
- TypeScript example with `svelte`
- TypeScript example with `vue`
