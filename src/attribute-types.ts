// Import this file with `import type` if using `@lume/element` to register the
// `has=""` attribute type for JSX templates.

// @ts-ignore unused imported JSX type to make this file appear as an importable
// module, rather than it being ambient/global.
import type {JSX} from '@lume/element'

declare module '@lume/element' {
	namespace JSX {
		interface CustomAttributes<T> {
			has?: string
		}
	}
}
