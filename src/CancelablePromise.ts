import {Privates} from './Privates.js'

export const _ = Privates()

export interface CancelablePromiseOptions {
	rejectOnCancel?: boolean
}

export class PromiseCancellation extends Error {}

export class CancelablePromise<T> extends Promise<T> {
	canceled: boolean

	constructor(
		executor: Promise<T> | ((resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void),
		options: CancelablePromiseOptions,
	) {
		const rejectOnCancel = options ? options.rejectOnCancel : false
		let originalReject

		// if the first arg is a promise-like
		if (executor instanceof Promise) {
			const promise = executor

			super((resolve, reject) => {
				originalReject = reject

				promise
					.then(value => {
						if (this.canceled) return
						resolve(value)
					})
					.catch(error => {
						if (this.canceled) return
						reject(error)
					})
			})
		} else {
			super((resolve, reject) => {
				originalReject = reject
				executor(
					value => {
						if (this.canceled) return
						resolve(value)
					},
					error => {
						if (this.canceled) return
						reject(error)
					},
				)
			})
		}

		this.canceled = false
		_(this).originalReject = originalReject
		_(this).rejectOnCancel = rejectOnCancel
	}

	cancel() {
		this.canceled = true

		if (_(this).rejectOnCancel) {
			_(this).originalReject(new PromiseCancellation('canceled'))
		}
	}
}
