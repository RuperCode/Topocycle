export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class StatefulElement{
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
  
  clear() {
    this.element.innerHTML = ""; 
    this.currentState = null;
  }
  
}



//------------------------------------


export class Lock {
  #interlocking; // private

  constructor(interlocking = null) {
    this.currentKey = null;
    this.#interlocking = interlocking;
  }

  isLocked() {
    return this.currentKey !== null;
  }

  isInterLocked() {
    if (!this.#interlocking) return false;
    return this.#interlocking.isInterlocked(this);
  }

  lock(key) {
    if (this.isLocked()) return false;
    if (this.isInterLocked()) return false;
    this.currentKey = key;
    return true;
  }

  unlock(key) {
    if (this.currentKey === key) {
      this.currentKey = null;
      return true;
    }
    return false;
  }

  // Interlocking needs to check this
  _getInterlocking() {
    return this.#interlocking;
  }
}



//------------------------------------


export class Interlocking {
  constructor() {
    this.interlocks = new Map(); // name -> Set<Lock>
    this.lockToInterlocks = new Map(); // Lock -> Set<name>
  }

  newLock() {
    return new Lock(this);
  }

  addToInterlock(name, lock) {
    // Reject locks not created by this Interlocking
    if (lock._getInterlocking() !== this) {
      throw new Error("Lock does not belong to this Interlocking");
    }

    // Create interlock group if needed
    if (!this.interlocks.has(name)) {
      this.interlocks.set(name, new Set());
    }

    // Add lock to group
    this.interlocks.get(name).add(lock);

    // Reverse mapping
    if (!this.lockToInterlocks.has(lock)) {
      this.lockToInterlocks.set(lock, new Set());
    }
    this.lockToInterlocks.get(lock).add(name);
  }

  isInterlocked(lock) {
    const groups = this.lockToInterlocks.get(lock);
    if (!groups) return false;

    for (const groupName of groups) {
      const group = this.interlocks.get(groupName);
      for (const otherLock of group) {
        if (otherLock !== lock && otherLock.isLocked()) {
          return true;
        }
      }
    }

    return false;
  }

  getInterlock(name) {
    const group = this.interlocks.get(name);
    return group ? Array.from(group) : [];
  }

  getInterlocks() {
    const result = {};
    for (const [name, group] of this.interlocks.entries()) {
      result[name] = Array.from(group);
    }
    return result;
  }

  clearInterlock(name) {
    const group = this.interlocks.get(name);
    if (!group) return;

    for (const lock of group) {
      const set = this.lockToInterlocks.get(lock);
      if (set) {
        set.delete(name);
        if (set.size === 0) {
          this.lockToInterlocks.delete(lock);
        }
      }
    }

    this.interlocks.delete(name);
  }
}
