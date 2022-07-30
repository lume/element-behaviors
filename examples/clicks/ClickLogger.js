// export
class ClickLogger {
	constructor(element) {
		this.onClick = () => console.log('clicked on element: ', element)
	}

	connectedCallback(element) {
		element.addEventListener('click', this.onClick)
	}

	disconnectedCallback(element) {
		element.removeEventListener('click', this.onClick)
	}
}

elementBehaviors.define('click-logger', ClickLogger)
