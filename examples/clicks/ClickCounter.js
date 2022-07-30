// export
class ClickCounter {
	constructor(element) {
		this.element = element
		this.count = 0
	}

	onClick = () => {
		this.count++
		this.render()
	}

	render() {
		this.element.textContent = `count: ${this.count}`
	}

	connectedCallback() {
		this.render()

		this.element.addEventListener('click', this.onClick)
	}

	disconnectedCallback() {
		this.element.removeEventListener('click', this.onClick)
	}
}

elementBehaviors.define('click-counter', ClickCounter)
