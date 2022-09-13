// TODO safe types for privates
export function Privates() {
	const storage = new WeakMap()

	return (obj: object) => {
		let privates = storage.get(obj)
		if (!privates) storage.set(obj, (privates = {}))
		return privates
	}
}
