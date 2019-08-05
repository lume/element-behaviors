# element-behaviors

Apply any number of functionalities ("behaviors") to an HTML element.

#### `npm i element-behaviors --save`

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
    constructor( element ) {
    }

    // called any time the associated `element` is added to the DOM
    connectedCallback( element ) {
    }

    // called any time the associated `element` is removed from the DOM
    disconnectedCallback( element ) {
    }

    // as with custom elements, define which attributes of the associated element that the behavior reacts to
    static get observedAttributes() {
        return [ ... ]
    }

    // called any time an observed attribute of the associated element has been changed
    attributeChangedCallback( element, attributeName, oldValue, newValue ) {
    }

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
    class Foo { ... }
    elementBehaviors.define('foo', Foo)

    class Bar { ... }
    elementBehaviors.define('bar', Bar)

    class Baz { ... }
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

> Note! If you were to call `div.setAttribute('has', 'click-logger')` thinking that you were adding
> the "click-logger" behavior, you will have removed all three "foo", "bar", and "baz" behaviors
> because the new `has` attribute is `has="click-loger"`.

### Element.behaviors (WIP)

To make it easier to add and remove behaviors, there will be an API similar to
[`Element.classList`](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList), but
called `Element.behaviors`. This will prevent us from having to wrangle with strings when setting
the `has` attribute. Just like with `classList`, modifying `behaviors` would also update the
`has=""` attribute value. For example:

```js
const el = document.querySelector('div')

// suppose we have <div has="foo bar baz">

el.behaviors.add('click-logger')
el.behaviors.remove('foo')

// now we have <div has="bar baz click-logger">
```

I am wondering if `.behaviors` should be a property on all elements, or if behaviors should be
stored in a global map. For example:

```js
elementBehaviors.of(el).add('click-logger')
elementBehaviors.of(el).remove('baz')
```

I currently have this add/remove functionality implemented
[here](https://github.com/trusktr/infamous/blob/v18.0.10/src/html/behaviors/DefaultBehaviors.js), as
part of Infamous, but this is not standlone yet.

If you have any thoughts on this API, please
[let me know](https://github.com/trusktr/element-behaviors/issues/1)!

### Default behaviors (WIP)

I'm not sure if this should be included here. Maybe it should end up in a separate library built on
top of element-behaviors, but I'm placing the idea here, for now.

The
[DefaultBehaviorsMixin](https://github.com/trusktr/infamous/blob/v18.0.10/src/html/behaviors/DefaultBehaviors.js)
of Infamous gives Custom Element classes the ability to define which behaviors they ship with by
default, which is super useful!

To define a Custom Element with default behaviors, it is done similarly to `observedAttributes`:

```js
class SomeElement extends DefaultBehaviorsMixin(HTMLElement) {
    // If you know how to define observed attributes on your Custom Element,
    static get observedAttributes() {
        return ['some-attribute', 'other-attribute']
    }

    // then you can basically do the same to define default behaviors:
    static get defaultBehaviors() {
        return ['some-behavior', 'click-logger']
    }
}
```

Additionally, `defaultBehaviors` can return an object whose key names are behavior names, and whose
values are functions that return true or false to determine if a default behavior should be
initially added to the element or not. The function will receive the element, as well as intial
behaviors that the element already has defined by the `has=""` attribute when the element is
created.

For example, suppose we have the following HTML:

```html
<my-div has="another-behavior"></my-div> <my-div has="some-behavior"></my-div>
```

and we define a Custom Element like:

```js
class SomeElement extends DefaultBehaviorsMixin(HTMLElement) {
    static get defaultBehaviors() {
        return {
            'click-logger': (element, initialBehaviors) => {
                if (initialBehaviors.includes('another-behavior')) {
                    return false
                }
                return true
            },
        }
    }
}
```

then when the `my-div` elements are created, only the one without the `another-behavior` will have
`click-logger` added to it, so the resulting DOM will be as follows:

```html
<my-div has="another-behavior"></my-div> <my-div has="some-behavior click-logger"></my-div>
```

## Note

See this [long issue](https://github.com/w3c/webcomponents/issues/509) on w3c's webcomponents repo,
which led to [the issue](https://github.com/w3c/webcomponents/issues/662) where the idea was born,
with some ideas from this [other issue](https://github.com/w3c/webcomponents/issues/663) (thanks to
all who helped to discuss the idea!).

## Caveats

Unless you run this in a modern browser, then:

-   Requires MutationObserver, you'll need a polyfill for older browsers.
-   Requires Map, you'll need a polyfill for older browsers.
-   Extends native builtin classes using `class` syntax, so you'll need
    babel-transform-builtin-extends for older browsers. Babel 7 includes this by default, but it
    [doesn't work yet](https://github.com/babel/babel/pull/7020#issuecomment-362113864), and Babel 7
    is still in Beta.
-   This package is currently written in ES6+ code, and not transpiled. You'll need to transpile
    yourself for older browsers. Meteor 1.6.2+ allows transpiling of node_modules, and you can also
    configure Webpack and other tools to transpile things in node_modules.
-   Uses [custom-attributes](https://github.com/matthewp/custom-attributes) by @matthewp to
    implement the `has=""` attribute. You might need more polyfills and/or to transpile that project
    too.

Otherwise, this should work fine in all the latest versions of Chrome, Firefox, Edge, Safari, and
Opera (and probably other lesser-known browsers too).

Description of the package. TODO automate this.

## Contributing

First install dependencies:

```sh
npm install
```

### Code

Code files can be written in either JavaScript or TypeScript, and end in either `.js` or `.ts`
respectively.

Please make sure your editor obeys the rules in `.editorconfig`. There are editorconfig plugins for
just about every text editor out there. Please install it and make sure code follows the formatting
rules. For more info, see https://editorconfig.org.

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

Any files ending with `.test.js` or `.test.ts` anywhere in the `tests/` or `src/` folders are test
files that will be ran by Karma, the test runner.

To run tests:

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

-   clean the project of any previous build output
-   stash any changes in the repo
-   build the project in production mode
-   run the project's tests
-   increment the version number (according to SemVer rules depending on if you choose patch, minor,
    or major)
-   create a new commit containing the version number in the form "v1.2.3" as the message
-   tag that commit with a git tag of the same name as the commit message
-   publish the new version to NPM
-   push the commit and the tag to GitHub
-   and finally unstash any changes if there were any

If something goes wrong (f.e. an error during the build or test process), fear not, the package will
not be published. Fix the failing tests, and try again. Note, after a failure, changes that were
stashed will remain stashed.
