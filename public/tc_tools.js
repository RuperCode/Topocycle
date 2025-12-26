class StateMachine {
  constructor(element) {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Constructor requires an HTML element");
    }
    this.element = element;
    this.states = {};        // stateName -> template string
    this.currentState = null;
  }

  defineState(name, template) {
    this.states[name] = template;
  }

  dropState(name) {
    delete this.states[name];
    if (this.currentState === name) {
      this.currentState = null;
      this.element.innerHTML = ""; // clear element if active state removed
    }
  }

  setState(name, params = {}) {
    if (!this.states.hasOwnProperty(name)) {
      throw new Error(`State "${name}" not defined`);
    }

    let output = this.states[name];

    // Replace $param markers
    output = output.replace(/\$(\w+)/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });

    this.element.innerHTML = output; // always interpret as HTML
    this.currentState = name;
  }

  getState() {
    return this.currentState;
  }
}