// TODO: element behaviors currently don't work on elements when they are
// defined (via elementBehaviors.define()) after the elements are already in the
// DOM. Make it order-independent.

export * from './BehaviorMap.js'
export * from './BehaviorRegistry.js'
export * from './HasAttribute.js'

// Leave this last line alone, it gets automatically updated when publishing a
// new version of this package.
export const version = '5.0.3'
