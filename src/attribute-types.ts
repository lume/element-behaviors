// Import this file with `import type` if using `@lume/element` to register the
// `has=""` attribute type for JSX templates.

declare module '@lume/element' {
	namespace JSX {
		interface CustomAttributes<T> {
			has?: string
		}
	}
}
