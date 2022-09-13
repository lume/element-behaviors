import type {} from 'solid-js'

declare module 'solid-js' {
	namespace JSX {
		interface CustomAttributes<T> {
			has?: string
		}
	}
}
