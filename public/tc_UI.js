import { StatefulElement, AsyncGate } from './tc_tools.js';
import { Junction, Segment, NetworkLayer, NetworkLayerStack, MapUILayer } from './tc_mapping.js';
import { wait, waitForTransition} from './tc_tools.js';


export class UserAccountUIC extends StatefulElement {

// Define event handlers in class field functions before constructor so we can bind(this) in this constructor

  messageBar;
  dialogueBox; 
  extraControls;
  lock;
  account;

    authenticate = async function() {

      if (this.lock.isLocked()) return;

      this.lock.lock(this);

      this.extraControls.close();
      this.extraControls.setState("logging-in", null, this.afterExtraRender);

      try {
        await this.extraControls.open();

        if(this.extraControls.getState() === "logging-in"){
          this.extraControls.lock.lock(this); 
          this.setState("authenticating");
        } else { 
          this.messageBar.flashState("login-unavailable");
        }
         
      } catch(err){
        // This should be an error dialogue really...
        this.messageBar.flashState("login-unavailable");
        this.extraControls.lock.unlock(this); 
      } finally {
        this.lock.unlock(this);
      }

    };


    cancelAuthentication = function() {

      
      if (this.lock.isLocked()) return;
      this.lock.lock(this);

      this.extraControls.close(this);
      this.extraControls.clear(this);
      this.extraControls.lock.unlock(this);  
      this.setState("logged-out");

      this.lock.unlock(this);

    };




    submitLogin = async function() {

      if (this.lock.isLocked()) return;
      this.lock.lock(this);

      const identifier = this.extraControls.element.querySelector("#identifier").value;
      const password = this.extraControls.element.querySelector("#password").value;

      try {
        const currentUser = await this.account.login(identifier, password);
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-in", {currentUserName: currentUser.username});
    
      } catch (err) {
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-out");
        let message = "Login failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);

      } finally {
        this.lock.unlock(this);
      }

    };

    register = function() {

      if (this.lock.isLocked()) return;
      this.lock.lock(this);

      this.extraControls.close(this);
      this.extraControls.setState("registering", null, this.afterExtraRender, this);
      this.extraControls.open(this);

      this.lock.unlock(this);

    };

    submitRegistration = async function() {

      const username = this.extraControls.element.querySelector("#regUsername").value;
      const email = this.extraControls.element.querySelector("#regEmail").value;
      const password = this.extraControls.element.querySelector("#regPassword").value;
      const confirm = this.extraControls.element.querySelector("#regConfirm").value;

      if (password !== confirm) {
        this.element.querySelector("#regMessage").textContent = "Passwords do not match.";
        return;
      }
      if (username.trim() === "") {
        this.element.querySelector("#regMessage").textContent = "Username is required.";
        return;
      }

      if (this.lock.isLocked()) return;
      this.lock.lock(this);

      try {
        const currentUser = await this.account.register(username, email, password);
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-in", {currentUserName: currentUser.username});
        
      } catch (err) {
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-out");
        let message = "Registration failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);

      } finally {
        this.lock.unlock(this);
      }

    };
    

    submitLogout = async function() {

      try {
        await this.account.logout();
        this.setState("logged-out");

      } catch (err) {
        let message = "Log out failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);
   
      } finally {
        this.lock.unlock(this);
      }
      
    };


    cancelLogout = async function() {
      this.lock.unlock(this);
    };


    logout = function() {

      if (this.lock.isLocked()) return;
      this.lock.lock(this);

      this.dialogueBox.setState(
        "confirming", 
        {confirmation: "Are you sure you want to log out?"}, 
        this.submitLogout, 
        this.cancelLogout
      );
    };

  constructor(element, messageBar, dialogueBox, extraControls, lock, account) {
    super(element);

    this.messageBar = messageBar;
    this.dialogueBox = dialogueBox; 
    this.extraControls = extraControls;
    this.lock = lock;
    this.account = account;

 // Bind(this) for the event handlers so that they can be used as such a know about 'this'

    this.authenticate = this.authenticate.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
    this.submitLogin = this.submitLogin.bind(this);
    this.submitRegistration = this.submitRegistration.bind(this);
    this.submitLogout= this.submitLogout.bind(this);
    this.cancelAuthentication = this.cancelAuthentication.bind(this);
    this.cancelLogout = this.cancelLogout.bind(this);
    this.afterExtraRender = this.afterExtraRender.bind(this)


    // Define the fixed HTML states for this UIC
    this.defineState("logged-out",`
      <h3>User</h3>
      <div class="user-box">
        <div class="user-icon red"><i class="fas fa-user"></i></div>
        <p>Unknown user</p>
        <button id="authenticateBtn">Login/Register</button>
      </div>
    `);

    this.defineState("logged-in",`
      <h3>User</h3>
      <div class="user-box">
        <div class="user-icon green"><i class="fas fa-user"></i></div>
        <p>$currentUserName</p>
        <button id="logoutBtn">Logout</button>
      </div>
    `);

    this.defineState("authenticating",`
      <h3>User</h3>
      <div class="user-box">
        <div class="user-icon amber"><i class="fas fa-user"></i></div>
        <p>Authenticating...</p>
      </div>
    `);

    // Define the fixed HTML states for extraControls
    this.extraControls.defineState("logging-in",`
      <div class="user-auth">
        <h3>Login</h3>
        <input type="text" id="identifier" placeholder="Username or Email"><br>
        <input type="password" id="password" placeholder="Password"><br>          
        <button id="confirmLoginBtn">Login</button>
        <button id="cancelLoginBtn">Cancel</button>       
        <p><a href="#" id="registerLink">Not a registered user? Set up as a user now...</a></p>
      </div>
    `);

    this.extraControls.defineState("registering",`
      <div class="user-auth">
        <h3>Register</h3>
        <input type="text" id="regUsername" placeholder="Username"><br>
        <input type="email" id="regEmail" placeholder="Email"><br>
        <input type="password" id="regPassword" placeholder="Password"><br>
        <input type="password" id="regConfirm" placeholder="Confirm Password"><br>
        <button id="confirmRegBtn">Register Now</button>
        <button id="cancelRegBtn">Cancel</button>
        <p id="regMessage" style="color:red;"></p>
      </div>
    `);

    this.messageBar.defineState("login-unavailable",`
      <p>Current action must be completed before logging in</p>
    `);

  }

  afterRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "logged-out":
        this.element.querySelector("#authenticateBtn").onclick = this.authenticate;
      break;

      case "logged-in":
        this.element.querySelector("#logoutBtn").onclick = this.logout;
      break;

      case "authenticating":
        // NO BUTTONS
      break;

      default:
        //  No default handlers to be set

    }

  }

  afterExtraRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "logging-in":
        this.extraControls.element.querySelector("#confirmLoginBtn").onclick = this.submitLogin;
        this.extraControls.element.querySelector("#cancelLoginBtn").onclick = this.cancelAuthentication;    
        this.extraControls.element.querySelector("#registerLink").onclick = this.register;
      break;

      case "registering":
        this.extraControls.element.querySelector("#confirmRegBtn").onclick = this.submitRegistration;
        this.extraControls.element.querySelector("#cancelRegBtn").onclick = this.cancelAuthentication;
        
      break;

      default:
        //  No default handlers to be set

    }

  }

  //!! CAN THIS METHOD BE ASYNC? SHOULD IT BE A CLASS FIELD FUNCTION?
  async checkState() {
  
    try {
      const currentUser = await this.account.check();

      if (!currentUser) {
        this.setState("logged-out");
      } else {

        this.setState("logged-in", {currentUserName: currentUser.username});
      }

    } catch (err) {
      //Call to check function failed
      //NEED TO HANDLE ERRORS HERE MORE PROPERLY
      this.setState("logged-out");
    }
  
  }

}




//------------------------------------------------




export class DialogueBoxUIC extends StatefulElement {

  // Private field declaration only (no initialisation here)
  #displaySequence;

  confirmCallback;
  cancelCallback;

  // Event handlers defined as class fields so they can be bound in constructor
  dismiss = function () {
    this.clear();
    if (this.confirmCallback) {
      this.confirmCallback();
    }
  };

  confirm = function () {
    this.clear();
    if (this.confirmCallback) {
      this.confirmCallback();
    }
  };

  cancel = function () {
    this.clear();
    if (this.cancelCallback) {
      this.cancelCallback();
    }
  };

  constructor(element) {
    super(element);

    // Initialise the private gate here (correct syntax)
    this.#displaySequence = new AsyncGate();

    // Bind event handlers
    this.dismiss = this.dismiss.bind(this);
    this.confirm = this.confirm.bind(this);
    this.cancel = this.cancel.bind(this);

    // Define the fixed HTML states
    this.defineState("notifying", `
      <p>$message</p>
      <button id="dismissPopupBtn">Dismiss</button>
    `);

    this.defineState("confirming", `
      <p>$confirmation</p>
      <button id="confirmPopupBtn">Confirm</button>
      <button id="cancelPopupBtn">Cancel</button>
    `);
  }

  async setState(state, params, confirmCallback, cancelCallback) {

    await this.#displaySequence.acquire();

    this.confirmCallback = confirmCallback;
    this.cancelCallback = cancelCallback;

    super.setState(state, params);

  }

  afterRender(state) {

    switch (state) {

      case "notifying":
        this.element.querySelector("#dismissPopupBtn").onclick = this.dismiss;
        this.show();
        break;

      case "confirming":
        this.element.querySelector("#confirmPopupBtn").onclick = this.confirm;
        this.element.querySelector("#cancelPopupBtn").onclick = this.cancel;
        this.show();
        break;

      default:
        // No default handlers
    }
  }

  clear() {
    this.hide();
    super.clear();

    this.#displaySequence.release();
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }

}




//------------------------------------------------




export class MessageBarUIC extends StatefulElement {

  revertState;
  flashCounter;

  constructor(element) {
    super(element);

    this.revertState = null;
    this.flashCounter = 0;

    this.defineState("test-message", "<p>Message Bar UIC up and running</p>");

  }


 async flashState(state, duration = 6000) {

    // Only the first flash in a burst sets the revert state
    if (this.revertState === null) {
      this.revertState = this.currentState;
    }

    // Each flash gets a unique ID
    const myFlashId = ++this.flashCounter;

    // Apply the temporary state
    this.setState(state);

    // Wait
    try {
      await wait(duration);
    } catch (err) {
      // swallows error to ensure state reversion runs in any event
    }

    // Only the latest flash is allowed to revert
    if (myFlashId === this.flashCounter) {
      this.setState(this.revertState);
      this.revertState = null;
    }
  }

}




//-----------------------------------------------------------------------




export class OLD_ExtraControlsUIC extends StatefulElement {

  constructor(element, lock) {
    super(element);
    this.lock = lock;
    this.actionSequence = new AsyncGate();
    this.endState = null
    this.isOpen = false;
  }

  async setState(state, params, afterAfterRender) {

    this.endState = state;

    await this.actionSequence.acquire();

    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return false;
    }

    super.setState(state, params);

    try {
      if (afterAfterRender) {
        afterAfterRender(state);
      }
    } catch(err) {
      // Swallow error to ensure actionSequence released in any event
    }

    this.actionSequence.release();
  }

  async clear() {

    this.endState = null;

    await this.actionSequence.acquire();

    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return;
    }

    super.clear();

    this.actionSequence.release();
  }

  async open() {

    await this.actionSequence.acquire();
    
    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return;
    }
    
    if (!this.isOpen) {
      this.isOpen = true;
      this.element.classList.add('shown');
      await waitForTransition(this.element);
    }

    this.actionSequence.release();
  }

  async close() {

    await this.actionSequence.acquire();

    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return;
    }

    if (this.isOpen) {
      this.isOpen = false;
      this.element.classList.remove('shown');
      await waitForTransition(this.element);
    }

    this.actionSequence.release();
  }
  
  getEndState() {
    return this.endState;
  }
  
  
}



export class ExtraControlsUIC extends StatefulElement {

  constructor(element, lock) {
    super(element);
    this.lock = lock;
    this.actionSequence = new AsyncGate();
    this.endState = null;
    this.isOpen = false;
  }

  async setState(state, params, afterAfterRender, caller) {

    this.endState = state;

    await this.actionSequence.acquire();
    try {

      if (this.lock.isInterlocked(caller)) {
        return false;
      }

      super.setState(state, params);

      if (afterAfterRender) {
        try {
          afterAfterRender(state);
        } catch (err) {
          // swallow to avoid deadlock; caller can log if needed
        }
      }

    } finally {
      this.actionSequence.release();
    }
  }

  async clear(caller) {

    this.endState = null;

    await this.actionSequence.acquire();

    try {

      if (this.lock.isInterlocked(caller)) {
        return;
      }

      super.clear();

    } finally {
      this.actionSequence.release();
    }
  }

  async open(caller) {

    await this.actionSequence.acquire();

    try {

      if (this.lock.isInterlocked(caller)) {
        return;
      }

      if (!this.isOpen) {
        this.isOpen = true;
        this.element.classList.add('shown');
        try {
          await waitForTransition(this.element);
        } catch (err) {
          // swallow transition errors to avoid deadlock
        }
      }

    } finally {
      this.actionSequence.release();
    }
  }

  async close(caller) {

    await this.actionSequence.acquire();

    try {

      if (this.lock.isInterlocked(caller)) {
        return;
      }

      if (this.isOpen) {
        this.isOpen = false;
        this.element.classList.remove('shown');
        try {
          await waitForTransition(this.element);
        } catch (err) {
          // swallow transition errors to avoid deadlock
        }
      }

    } finally {
      this.actionSequence.release();
    }
  }

  getEndState() {
    return this.endState;
  }

}



//-----------------------------------------------------------------------



export class ModeSelectionUIC extends StatefulElement {


// Define event handlers in class field functions before constructor so we can bind(this) in this constructor
  testShowDialogue = function () {
    this.dialogueBox.setState("notifying", {message: "DialogueBoxUIC up and running"});
  }

  testOpenExtra = async function () {
    if(this.extraControls.getEndState() === "testing-from-modeSelector"){
      this.extraControls.open();
    } else {
      this.extraControls.close();
      this.extraControls.setState("testing-from-modeSelector", null, this.afterExtraRender);
      this.extraControls.open();
    }
  };

  testCloseExtra = function () {
    this.extraControls.close();
  };
  

  flashMessageA = function () {
    this.messageBar.flashState("test-a");
  };
  
  
  flashMessageB = function () {
    this.messageBar.flashState("test-b", 3000);
  };

  endTest = function () {
    this.clear();
  };
  

  initiateAddSegment = function () {
    this.layerSelector.lock();
    this.mapManager.setMode(new AddSegmentMode());
    this.setState("segment-adding-a");
  };

  cancelAddSegment = function () {

  }
  
  addSegmentUndoStage = function () {

  }

  confirmAddSegment = function () {     
  
  }

  confirmedAddSegment = function () {
  
  }

  onModeEnd = function () {
    this.layerSelector.unlock();
    this.clear();     
  }


  constructor(element, mapManager, messageBar, dialogueBox, extraControls, layerSelector, lock){

    super(element);
    
    this.mapManager = mapManager;
    this.messageBar = messageBar;
    this.dialogueBox = dialogueBox;
    this.extraControls = extraControls;
    this.layerSelector = layerSelector;
    this.lock = lock;

    // Bind(this) for the event handlers so that they can be used as such a know about 'this'
    this.testShowDialogue = this.testShowDialogue.bind(this); 
    this.testOpenExtra = this.testOpenExtra.bind(this); 
    this.testCloseExtra = this.testCloseExtra.bind(this); 
    this.flashMessageA = this.flashMessageA.bind(this);
    this.flashMessageB = this.flashMessageB.bind(this);
    this.endTest = this.endTest.bind(this);
    this.initiateAddSegment = this.initiateAddSegment.bind(this);
    this.cancelAddSegment = this.cancelAddSegment.bind(this);
    this.addSegmentUndoStage = this.addSegmentUndoStage.bind(this);
    this.onModeEnd = this.onModeEnd.bind(this);
    
    // Bind this for callbacks 
    this.afterExtraRender = this.afterExtraRender.bind(this);

    // Define the fixed HTML states for this UIC
    this.defineState("testing",`
      <p>ModeSelectorUIC up and running</p>
      <button id="openExtraControlsBtn">Open Extra Controls</button>
      <button id="showDialogueBoxBtn">Show Dialogue Box</button>
      <button id="flashABtn">Flash A</button>
      <button id="flashBBtn">Flash B</button>
      <button id="endTestBtn">Flash C</button>
    `);

    this.defineState("segment-selecting",`
      <button id="addSegmentBtn">Add Segment</button>
    `);


    this.defineState("segment-adding-a",`
      <button id="cancelAddSegmentBtn">Cancel</button>
    `);

    this.defineState("segment-adding-b",`
      <button id="undoAddSegmentStageBtn">Undo</button>
      <button id="cancelAddSegmentBtn">Cancel</button>
    `);

    this.defineState("segment-adding-confirm",`
      <button id="undoAddSegmentStageBtn">Undo</button>
      <button id="cancelAddSegmentBtn">Cancel</button>
      <button id="confirmAddSegmentBtn">Confirm</button>
    `);



    // DEFINE OTHER REQUIRED STATES HERE

    // SET THE DEFAULT STATE

    this.defaultState = "segment_selecting"

    // DEFINE STATES FOR EXTRACONTROLS
    this.extraControls.defineState("testing-from-modeSelector",`
      <p>ExtraControlsUIC up and running</p>
      <button id="closeExtraControlsBtn">Close</button>
    `);


    // DEFINE STATES FOR MESSAGEBAR
    this.messageBar.defineState("test-a",`
      <p>Test massage AAAAAAAAAA</p>
    `);
    
    this.messageBar.defineState("test-b",`
      <p>Test massage BB  BB  BB  BB  BB</p>
    `);



    // INITIATE IN DEFAULT STATE
    this.setState("segment-selecting");

  }

  afterRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "testing":
        this.element.querySelector("#showDialogueBoxBtn").onclick = this.testShowDialogue;
        this.element.querySelector("#openExtraControlsBtn").onclick = this.testOpenExtra;
        this.element.querySelector("#flashABtn").onclick = this.flashMessageA;
        this.element.querySelector("#flashBBtn").onclick = this.flashMessageB;
        this.element.querySelector("#endTestBtn").onclick = this.endTest;
      break;

      case "segment-selecting":
        this.element.querySelector("#addSegmentBtn").onclick = this.initiateAddSegment;
      break;

      case "segment-selecting":
        this.element.querySelector("#addSegmentBtn").onclick = this.initiateAddSegment;
      break;

      case "segment-adding-a":
        this.element.querySelector("#addSegmentBtn").onclick = this.initiateAddSegment;
      break;

      case "segment-adding-b":
        this.element.querySelector("#addSegmentBtn").onclick = this.initiateAddSegment;
      break;

      case "segment-adding-confirm":
        this.element.querySelector("#addSegmentBtn").onclick = this.initiateAddSegment;
      break;

      default:
        //  No default handlers to be set

    }
    
  } 

  afterExtraRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "testing-from-modeSelector":
        this.extraControls.element.querySelector("#closeExtraControlsBtn").onclick = this.testCloseExtra;
      break;

      default:
        //  No default handlers to be set

    }

  }
  
  
  clear() {
    // Overridden to effect a default state
    this.setState(this.defaultState);

  }
  
  
}





//---------------------------------------------------------------





export class MapManagerUIC {


  constructor(element, lock) {

    this.element = element;
    this.lock = lock;
    this.currentMode = null;

    this.map = null;
    this.baseLayer = null
    this.networkLayerStack = new NetworkLayerStack();
    this.mapUILayer = new MapUILayer();

    //!! TEMPORARY - TO BE REPLACED WITH SERVER INTERACTION IN LayerSelectorUIC
    this.networkLayerStack.addLayer(new NetworkLayer(1, "New Layer"));

  }

  initMap() {

    this.map = L.map(this.element.id).setView([51.4, -0.35], 13);
    
    this.baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });

    this.renderMap()

  }

  refreshMap() {
    if (!this.map) {
      return;
    }
    this.map.clearLayers();
    this.map.renderMap();
  }

  renderMap() {
    if (!this.map) {
      return;
    }
    this.map.addLayer(this.baseLayer);
    this.map.addLayer(this.networkLayerStack.getLeaflet())
    this.map.addLayer(this.mapUILayer.getLeaflet())
  }

  setMode(mode) {
    if (this.currentMode) {
      this.currentMode.deactivate();
    }

    this.currentMode = mode;

    if (mode) {
      mode.activate(this);
    }
  }

  getMode() {
    return this.currentMode;
  }

  exitMode() {
    if (this.currentMode) {
      this.currentMode.deactivate();
      this.currentMode = null;
    }
  }

  destroyMap() {
    if (this.map) {
        this.map.remove();
        this.map = null;
    }
  }


}

