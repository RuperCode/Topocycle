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
      this.extraControls.setState("logging-in", null, this.afterExtraRender, null);

      try {
        await this.extraControls.open();

        if(this.extraControls.getState() === "logging-in"){
          this.extraControls.lock.lock(this); 
          this.setState("authenticating", null, null, null);
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
        this.setState("logged-in", {currentUserName: currentUser.username}, null, null);
    
      } catch (err) {
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-out", null, null, null);
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
      this.extraControls.setState("registering", null, this.afterExtraRender, null, this);
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
        this.setState("logged-in", {currentUserName: currentUser.username}, null, null);
        
      } catch (err) {
        this.extraControls.close(this);
        this.extraControls.clear(this);
        this.extraControls.lock.unlock(this);
        this.setState("logged-out", null, null, null);
        let message = "Registration failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null, null);

      } finally {
        this.lock.unlock(this);
      }

    };
    

    submitLogout = async function() {

      try {
        await this.account.logout();
        this.setState("logged-out", null, null, null);

      } catch (err) {
        let message = "Log out failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null, null);
   
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
        null,
        null,
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
        this.setState("logged-out", null, null, null);
      } else {

        this.setState("logged-in", {currentUserName: currentUser.username}, null, null);
      }

    } catch (err) {
      //Call to check function failed
      //NEED TO HANDLE ERRORS HERE MORE PROPERLY
      this.setState("logged-out", null, null, null);
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

  async setState(state, params, afterAfterRender, onStateChange, confirmCallback, cancelCallback) {

    await this.#displaySequence.acquire();

    this.confirmCallback = confirmCallback;
    this.cancelCallback = cancelCallback;

    super.setState(state, params, afterAfterRender, onStateChange);

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
    this.setState(state, null, null, null);

    // Wait
    try {
      await wait(duration);
    } catch (err) {
      // swallows error to ensure state reversion runs in any event
    }

    // Only the latest flash is allowed to revert
    if (myFlashId === this.flashCounter) {
      this.setState(this.revertState, null, null, null);
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

  async setState(state, params, afterAfterRender, onStateChange) {

    this.endState = state;

    await this.actionSequence.acquire();

    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return false;
    }

    super.setState(state, params, afterAfterRender, onStateChange);

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
    
    this.customMode = false;
  }

    async setState(state, params, afterAfterRender, onStateChange, caller) {

      this.endState = state;

      await this.actionSequence.acquire();
      try {

        if (this.lock.isInterlocked(caller)) {
          return false;
        }

        this.customMode = false;
        super.setState(state, params, afterAfterRender, onStateChange);

      } finally {
        this.actionSequence.release();
      }
    }


  async setCustomMode(onStateChange, caller) {

    this.endState = caller;

    await this.actionSequence.acquire();
    try {

      if (this.lock.isInterlocked(caller)) {
        return false;
      }

      this.customMode = true;
      this.onStateChange = onStateChange;
      this.element.innerHTML = ""; 
      this.currentState = null;


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

      this.customMode = false;
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
    this.dialogueBox.setState("notifying", {message: "DialogueBoxUIC up and running"}, null, null);
  }

  testOpenExtra = async function () {
    if(this.extraControls.getEndState() === "testing-from-modeSelector"){
      this.extraControls.open();
    } else {
      this.extraControls.close();
      this.extraControls.setState("testing-from-modeSelector", null, this.afterExtraRender, null);
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
  

  modeStartAddSegment = function () {
    this.layerSelector.lock();
    this.currentMode = new AddSegmentMode(this);
    this.mapManager.setMode(this.currentMode);
  };

  modeCancel = function () {
    this.currentMode.cancel();
  }
  
  modeUndo = function () {
    this.currentMode.undo()
  }

  modeConfirm = function () {     
    confirmation = "Add new segment to the active layer?";
    this.dialogueBox.setState("confirming", {confirmation: confirmation}, null, null, this.modeConfirmed, null);
  }

  modeConfirmed = function () {
    this.currentMode.confirm();
  }
 
  onModeEnded = function (mode) {
    if(mode === this.currentMode) {
      this.currentMode = null;
    }
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
    this.modeStartAddSegment = this.modeStartAddSegment.bind(this);
    this.modeCancel = this.modeCancel.bind(this);i
    this.modeUndo = this.modeUndo.bind(this);
    this.modeConfirm = this.modeConfirm.bind(this);
    this.modeConfirmed = this.modeConfirmed.bind(this);
    this.onModeEnded = this.onModeEnded.bind(this);
    
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
      <button id="modeCancelBtn">Cancel</button>
    `);

    this.defineState("segment-adding-b",`
      <button id="modeUndoBtn">Undo</button>
      <button id="modeCancelBtn">Cancel</button>
    `);

    this.defineState("segment-adding-confirm",`
      <button id="modeUndoBtn">Undo</button>
      <button id="modeCancelBtn">Cancel</button>
      <button id="modeConfirmBtn">Confirm</button>
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
    this.setState("segment-selecting", null, null, null);

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

      case "segment-adding-a":
        this.element.querySelector("#modeCancelBtn").onclick = this.modeCancel();
      break;

      case "segment-adding-b":
        this.element.querySelector("#modeCancelBtn").onclick = this.modeCancel();
        this.element.querySelector("#modeUndoBtn").onclick = this.modeUndo(); 
      break;

      case "segment-adding-confirm":
        this.element.querySelector("#modeCancelBtn").onclick = this.modeCancel();
        this.element.querySelector("#modeUndoBtn").onclick = this.modeUndo(); 
        this.element.querySelector("#modeConfirmBtn").onclick = this.modeConfirm();  
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
    this.setState(this.defaultState, null, null, null);

  }
  
  
}





//---------------------------------------------------------------





export class MapManagerUIC {


  constructor(element, lock) {

    this.element = element;
    this.lock = lock;
    this.currentMode = null;

    this.map = null;
    this.baseLayer = null;
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








//---------------------------------------------------------------








class LayerSelectorUIC {

    constructor(element, messageBar, dialogueBox, extraControls, mapManager, lock, currentUser) {
        this.element = element;
        this.messageBar = messageBar;
        this.dialogueBox = dialogueBox;
        this.extraControls = extraControls;
        this.mapManager = mapManager;
        this.lock = lock;
        this.currentUser = currentUser;

        this.ownsTheExtraControlsState = false;
        this.showRemoveButtons = false;

        this.availableLayers = {};
        this.schemas = {};

        this.nextLayerId = 1;
        this.nextSchemaId = 1;

        this.onExtraStateChange = this.onExtraStateChange.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onChange = this._onChange.bind(this); 

        this.element.addEventListener("click", this._onClick);
        this.element.addEventListener("change", this._onChange);
    }


    init() {
        // TEMPORARY: until server integration exists
        var schemaId = this.nextSchemaId++;
        var schema = new RenderingSchema(schemaId, "New Layer", this.currentUser);
        this.schemas[schemaId] = schema;

        var layerId = this.nextLayerId++;
        var layer = new NetworkLayer(layerId, "New Layer", this.currentUser);
        layer.setRenderingSchema(schema);

        this.mapManager.networkLayerStack.addLayer(layer);

        this.render();
        
        this.layerListElement = this.element.querySelector(".layer-list");
        this.manageLayersButton = this.element.querySelector(".manage-layers");
        this.manageSchemasButton = this.element.querySelector(".manage-schemas");

        this.manageLayersButton.addEventListener("click", this._openManageLayers.bind(this));
        this.manageSchemasButton.addEventListener("click", this._openManageSchemas.bind(this));

    }


    render() {
        this.layerListElement.innerHTML = "";

        var layers = this.mapManager.networkLayerStack.getOrderedLayers();
        var i, layer, row;

        for (i = 0; i < layers.length; i++) {
            layer = layers[i];
            row = this._buildLayerRow(layer, i, layers.length);
            this.layerListElement.appendChild(row);
        }

        if (this.lock.isInterlocked()) {
            this.element.classList.add("greyed-out");
        } else {
            this.element.classList.remove("greyed-out");
        }

        if (this.showRemoveButtons) {
            this.element.classList.add("removal-mode");
        } else {
            this.element.classList.remove("removal-mode");
        }
    }


    _buildLayerRow(layer, index, total) {
        var row = document.createElement("div");
        row.className = "layer-row";
        row.dataset.layerId = layer.id;

        if (this.showRemoveButtons) {
            var removeBtn = document.createElement("button");
            removeBtn.className = "remove-layer";
            removeBtn.textContent = "◀";
            row.appendChild(removeBtn);
        }

        var vis = document.createElement("input");
        vis.type = "checkbox";
        vis.className = "visibility-toggle";
        vis.checked = this.mapManager.networkLayerStack.isVisible(layer.id);
        row.appendChild(vis);

        if (layer.isOwnedBy(this.currentUser)) {
            var nameInput = document.createElement("input");
            nameInput.className = "layer-name-input";
            nameInput.value = layer.getName();
            row.appendChild(nameInput);
        } else {
            var nameSpan = document.createElement("span");
            nameSpan.className = "layer-name";
            nameSpan.textContent = layer.getName();
            row.appendChild(nameSpan);
        }

        var schemaSelect = document.createElement("select");
        schemaSelect.className = "schema-selector";
        this._populateSchemaSelect(schemaSelect, layer.getRenderingSchema());
        row.appendChild(schemaSelect);

        var moveBox = document.createElement("div");
        moveBox.className = "move-buttons";

        var upBtn = document.createElement("button");
        upBtn.className = "move-up";
        upBtn.textContent = "▲";
        if (index === 0) upBtn.disabled = true;
        moveBox.appendChild(upBtn);

        var downBtn = document.createElement("button");
        downBtn.className = "move-down";
        downBtn.textContent = "▼";
        if (index === total - 1) downBtn.disabled = true;
        moveBox.appendChild(downBtn);

        row.appendChild(moveBox);

        return row;
    }


    _populateSchemaSelect(select, currentSchema) {
        var ids = Object.keys(this.schemas);
        var i, id, s, opt;

        for (i = 0; i < ids.length; i++) {
            id = ids[i];
            s = this.schemas[id];

            opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.getName();
            if (currentSchema && s.id === currentSchema.id) opt.selected = true;
            select.appendChild(opt);
        }
    }


    _onClick(e) {
        if (this.lock.isInterlocked()) {
            this.render();
            return;
        }

        var row = e.target.closest(".layer-row");
        var layerId, layer;

        if (row) {
            layerId = parseInt(row.dataset.layerId, 10);
            layer = this.mapManager.networkLayerStack.getLayer(layerId);

            if (e.target.classList.contains("remove-layer")) {
                this.mapManager.networkLayerStack.removeLayer(layerId);
                this.availableLayers[layerId] = layer;
                this.render();
                this._refreshManageLayersDrawerIfOpen();
                return;
            }

            if (e.target.classList.contains("move-up")) {
                this.mapManager.networkLayerStack.moveLayerUp(layerId);
                this.render();
                return;
            }

            if (e.target.classList.contains("move-down")) {
                this.mapManager.networkLayerStack.moveLayerDown(layerId);
                this.render();
                return;
            }
        }
    }


    _onChange(e) {
        if (this.lock.isInterlocked()) {
            this.render();
            return;
        }

        var row = e.target.closest(".layer-row");
        var layerId, layer;

        if (row) {
            layerId = parseInt(row.dataset.layerId, 10);
            layer = this.mapManager.networkLayerStack.getLayer(layerId);

            if (e.target.classList.contains("visibility-toggle")) {
                this.mapManager.networkLayerStack.setVisible(layerId, e.target.checked);
                return;
            }
            
            if (e.target.classList.contains("layer-name-input")) {
                layer.setName(e.target.value);
                this.render();
                return;
            }

            if (e.target.classList.contains("schema-selector")) {
                var schema = this.schemas[e.target.value];
                layer.setRenderingSchema(schema);
                return;
            }
        }
    }


    async _openManageLayers() {
        await this.extraControls.close();

        var ok = await this.extraControls.setCustomMode(this.onExtraStateChange);
        if (!ok) return;

        this.ownsTheExtraControlsState = true;

        await this.extraControls.open();

        this.showRemoveButtons = true;
        this.render();

        var container = this.extraControls.getElement();

        var header = document.createElement("div");
        header.className = "drawer-header";

        var newBtn = document.createElement("button");
        newBtn.className = "new-layer";
        newBtn.textContent = "New Layer";
        header.appendChild(newBtn);

        var doneBtn = document.createElement("button");
        doneBtn.className = "done";
        doneBtn.textContent = "Done";
        header.appendChild(doneBtn);

        container.appendChild(header);

        var title = document.createElement("h2");
        title.textContent = "Available Layers";
        container.appendChild(title);

        var list = document.createElement("div");
        list.className = "available-layers-list scrollable";
        container.appendChild(list);

        this._renderAvailableLayersList(list);

        newBtn.addEventListener("click", this._handleNewLayer.bind(this));
        doneBtn.addEventListener("click", this._handleDoneLayers.bind(this));

        list.addEventListener("click", this._handleManageLayersClick.bind(this));
        list.addEventListener("change", this._handleManageLayersChange.bind(this));
    }


    _renderAvailableLayersList(list) {
        list.innerHTML = "";

        var ids = Object.keys(this.availableLayers);
        var i, id, layer, row;

        for (i = 0; i < ids.length; i++) {
            id = ids[i];
            layer = this.availableLayers[id];
            row = this._buildAvailableLayerRow(layer);
            list.appendChild(row);
        }
    }


    _buildAvailableLayerRow(layer) {
        var row = document.createElement("div");
        row.className = "available-layer-row";
        row.dataset.layerId = layer.id;

        if (layer.isOwnedBy(this.currentUser)) {
            var nameInput = document.createElement("input");
            nameInput.className = "layer-name-input";
            nameInput.value = layer.getName();
            row.appendChild(nameInput);
        } else {
            var nameSpan = document.createElement("span");
            nameSpan.className = "layer-name";
            nameSpan.textContent = layer.getName();
            row.appendChild(nameSpan);
        }

        var addBtn = document.createElement("button");
        addBtn.className = "add-layer";
        addBtn.textContent = "▶";
        row.appendChild(addBtn);

        return row;
    }


    _handleManageLayersChange(e) {
        var row = e.target.closest(".available-layer-row");
        if (!row) return;

        var layerId = parseInt(row.dataset.layerId, 10);
        var layer = this.availableLayers[layerId];

        if (e.target.classList.contains("layer-name-input")) {
            layer.setName(e.target.value);
        }
    }


    _handleManageLayersClick(e) {
        var row = e.target.closest(".available-layer-row");
        if (!row) return;

        var layerId = parseInt(row.dataset.layerId, 10);
        var layer = this.availableLayers[layerId];

        if (e.target.classList.contains("add-layer")) {
            this.mapManager.networkLayerStack.addLayer(layer);
            delete this.availableLayers[layerId];
            this.render();
            this._refreshManageLayersDrawerIfOpen();
        }
    }


    _refreshManageLayersDrawerIfOpen() {
        if (!this.ownsTheExtraControlsState) return;

        var container = this.extraControls.getElement();
        var list = container.querySelector(".available-layers-list");
        if (list) this._renderAvailableLayersList(list);
    }


    _handleNewLayer() {
        var stack = this.mapManager.networkLayerStack;

        if (stack.getOrderedLayers().length >= 3) {
            this.dialogueBox.setState("notifying", {
                message: "You can only have up to three layers in the stack."
            });
            return;
        }

        var schemaId = this.nextSchemaId++;
        var schema = new RenderingSchema(schemaId, "New Layer", this.currentUser);
        this.schemas[schemaId] = schema;

        var layerId = this.nextLayerId++;
        var layer = new NetworkLayer(layerId, "New Layer", this.currentUser);
        layer.setRenderingSchema(schema);

        stack.addLayer(layer);
        this.render();
    }


    _handleDoneLayers() {
        this.extraControls.clear();
    }


    async _openManageSchemas() {
        await this.extraControls.close();

        var ok = await this.extraControls.setCustomMode(this.onExtraStateChange);
        if (!ok) return;

        this.ownsTheExtraControlsState = true;

        await this.extraControls.open();

        var container = this.extraControls.getElement();

        var header = document.createElement("div");
        header.className = "schema-header";

        var label = document.createElement("label");
        label.textContent = "Manage schema:";
        label.setAttribute("for", "schema-picker");
        header.appendChild(label);

        var picker = document.createElement("select");
        picker.id = "schema-picker";
        picker.className = "schema-picker";
        header.appendChild(picker);

        var newBtn = document.createElement("button");
        newBtn.className = "new-schema";
        newBtn.textContent = "New Schema";
        header.appendChild(newBtn);

        var doneBtn = document.createElement("button");
        doneBtn.className = "done";
        doneBtn.textContent = "Done";
        header.appendChild(doneBtn);

        container.appendChild(header);

        var editor = document.createElement("div");
        editor.className = "schema-editor";

        var h3 = document.createElement("h3");
        h3.textContent = "Schema Settings";
        editor.appendChild(h3);
        
        var nameLabel = document.createElement("label");
        nameLabel.textContent = "Schema Name:";
        editor.appendChild(nameLabel);

        var nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.className = "schema-name-input";
        editor.appendChild(nameInput);

        var colourLabel = document.createElement("label");
        colourLabel.textContent = "Default Colour:";
        editor.appendChild(colourLabel);

        var colourInput = document.createElement("input");
        colourInput.type = "color";
        colourInput.className = "schema-colour-picker";
        editor.appendChild(colourInput);

        var weightLabel = document.createElement("label");
        weightLabel.textContent = "Default Weight:";
        editor.appendChild(weightLabel);

        var weightInput = document.createElement("input");
        weightInput.type = "number";
        weightInput.className = "schema-weight-input";
        editor.appendChild(weightInput);

        container.appendChild(editor);

        this._populateSchemaPicker(picker);

        picker.addEventListener("change", this._handleSchemaPickerChange.bind(this));
        newBtn.addEventListener("click", this._handleNewSchema.bind(this));
        doneBtn.addEventListener("click", this._handleDoneSchemas.bind(this));
        
        nameInput.addEventListener("change", this._handleSchemaNameChange.bind(this));
        colourInput.addEventListener("change", this._handleSchemaColourChange.bind(this));
        weightInput.addEventListener("change", this._handleSchemaWeightChange.bind(this));

        this._loadSchemaIntoEditor(picker.value);
    }


    _populateSchemaPicker(picker) {
        picker.innerHTML = "";

        var ids = Object.keys(this.schemas);
        var i, id, s, opt;

        for (i = 0; i < ids.length; i++) {
            id = ids[i];
            s = this.schemas[id];

            opt = document.createElement("option");
            opt.value = s.id;
            opt.textContent = s.getName();
            picker.appendChild(opt);
        }
    }


    _handleSchemaPickerChange(e) {
        this._loadSchemaIntoEditor(e.target.value);
    }


    _loadSchemaIntoEditor(schemaId) {
        var schema = this.schemas[schemaId];
        if (!schema) return;
        
        var container = this.extraControls.getElement();

        var nameInput = container.querySelector(".schema-name-input");
        var colourInput = container.querySelector(".schema-colour-picker");
        var weightInput = container.querySelector(".schema-weight-input");

        nameInput.value = schema.getName();
        colourInput.value = schema.getDefaultColour();
        weightInput.value = schema.getDefaultWeight();
    }


    _handleNewSchema() {
        var schemaId = this.nextSchemaId++;
        var schema = new RenderingSchema(schemaId, "New Schema", this.currentUser);
        this.schemas[schemaId] = schema;

        var picker = this.extraControls.getElement().querySelector(".schema-picker");
        this._populateSchemaPicker(picker);
        picker.value = schemaId;

        this._loadSchemaIntoEditor(schemaId);
    }


    _handleDoneSchemas() {
        this.extraControls.clear();
    }


    _handleSchemaNameChange(e) {
        var picker = this.extraControls.getElement().querySelector(".schema-picker");
        var schema = this.schemas[picker.value];

        schema.setName(e.target.value);

        // Update the picker text so the new name appears immediately
        this._populateSchemaPicker(picker);
        picker.value = schema.id;

        // Layers using this schema should update their display names
        this.render();
    }


    _handleSchemaColourChange(e) {
        var picker = this.extraControls.getElement().querySelector(".schema-picker");
        var schema = this.schemas[picker.value];
        schema.setDefaultColour(e.target.value);
        this.mapManager.networkLayerStack.refreshLayersThatUseSchema(schema.id);
    }


    _handleSchemaWeightChange(e) {
        var picker = this.extraControls.getElement().querySelector(".schema-picker");
        var schema = this.schemas[picker.value];

        var v = parseInt(e.target.value, 10);
        if (isNaN(v) || v <= 0) {
            e.target.value = schema.getDefaultWeight();
            return;
        }

        schema.setDefaultWeight(v);
        this.mapManager.networkLayerStack.refreshLayersThatUseSchema(schema.id);            
    }


    onExtraStateChange() {
        this.ownsTheExtraControlsState = false;
        this.showRemoveButtons = false;
        this.render();
    }


    lock(caller) {
        this.lock.lock(caller);
        this.element.classList.add("greyed-out");

        if (this.ownsTheExtraControlsState) {
            this.extraControls.clear();
        }
    }


    unlock(caller) {
        this.lock.unlock(caller);
        this.element.classList.remove("greyed-out");
    }


    isInterlocked() {
        return this.lock.isInterlocked();
    }
}
