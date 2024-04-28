// I'm not sure why, but commenting this line out breaks all Solid JSX type
// checking because all JSX types disappear except for the one from this file
// (at time of writing).
import type {} from 'solid-js'

declare module 'solid-js' {
	namespace JSX {
		interface CustomAttributes<T> {
			has?: string
		}
	}
}
