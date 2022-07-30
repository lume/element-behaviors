// export
class ClickLogger {
	constructor(element) {
		this.element = element
	}

	onClick = () => console.log('clicked on element: ', this.element)

	connectedCallback() {
		this.element.addEventListener('click', this.onClick)
	}

	disconnectedCallback() {
		this.element.removeEventListener('click', this.onClick)
	}
}

elementBehaviors.define('click-logger', ClickLogger)
