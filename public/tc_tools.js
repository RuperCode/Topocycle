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
    if (this.states.hasOwnProperty(name)) {
      throw new Error(`State "${name}" already defined. Drop it first before redefining.`);
    }
    this.states[name] = template;
  }

  dropState(name) {
    delete this.states[name];
    if (this.currentState === name) {
      this.clear();
    }
  }

  setState(name, params = {}) {
    if (!this.states.hasOwnProperty(name)) {
      throw new Error('State "' + name + '" not defined');
    }

    var template = this.states[name];

    // Extract required parameter names
    var regex = /\$(\w+)/g;  // This regex finds all occurrences of $word
    var match;
    var requiredParams = [];

    while ((match = regex.exec(template)) !== null) {
      requiredParams.push(match[1]);  // match[1] is the word after the $
    }

    // Check for missing parameters
    for (var i = 0; i < requiredParams.length; i++) {
      var p = requiredParams[i];
      if (!params || !params.hasOwnProperty(p)) {
        throw new Error(
          'Missing parameter "' + p + '" for state "' + name + '".'
        );
      }
    }

    // Check for unexpected parameters
    if (params) {
      for (var key in params) {
        if (requiredParams.indexOf(key) === -1) {
          throw new Error(
            'Unexpected parameter "' + key + '" for state "' + name + '".'
          );
        }
      }
    }

    // Replace placeholders
    var output = template.replace(/\$(\w+)/g, function(fullMatch, key) {
      return params[key];
    });

    // Render and call hook
    this.element.innerHTML = output;
    this.currentState = name;

    this.afterRender(name);
  }


  hasState(name) {
    return this.states.hasOwnProperty(name);
  }

  getState() {
    return this.currentState;
  }
  
  clear() {
    this.element.innerHTML = ""; 
    this.currentState = null;
  }

  afterRender(state){
    //FOR SUBCLASSSES TO OVERRIDE
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
    if (!group) return;l

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



//------------------------------------



export class AsyncGate {

  // True private fields (enforced by the language)
  #busy;
  #queue;

  constructor() {
    this.#busy = false;
    this.#queue = [];
  }

  acquire() {
    var self = this;

    return new Promise(function (resolve) {
      if (!self.#busy) {
        // Gate is free — take it immediately
        self.#busy = true;
        resolve();
      } else {
        // Gate is busy — queue the resolver
        self.#queue.push(resolve);
      }
    });
  }

  release() {
    if (this.#queue.length > 0) {
      // Pass gate to next waiter
      var nextResolve = this.#queue.shift();
      nextResolve();
    } else {
      // No waiters — gate becomes free
      this.#busy = false;
    }
  }
}




//------------------------------------



 
export function waitForTransition(element) {
    return new Promise(function (resolve) {
        function handler() {
            element.removeEventListener('transitionend', handler);
            resolve();
        }
        element.addEventListener('transitionend', handler);
    });
}




