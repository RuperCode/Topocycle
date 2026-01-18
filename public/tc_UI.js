import { StatefulElement, AsyncGate } from './tc_tools.js';
import { wait, waitForTransition} from './tc_tools.js';


export class UserAccountUIC extends StatefulElement {

// Define event handlers in class field functions before constructor so we can bind(this) in this constructor

  messageBar;
  dialogueBox; 
  extraControls;
  lock;
  account; no

    authenticate = async function() {
      
      if(this.extraControls.getEndState() === "logging-in"){
        await this.extraControls.open();
        this.extraControls.lock.lock(this); 
        this.setState("authenticating");
      } else {
        this.extraControls.close();
        this.extraControls.setState("logging-in", null, this.afterExtraRender);
        await this.extraControls.open();

        if(this.extraControls.getState() === "logging-in"){
          this.extraControls.lock.lock(this); 
          this.setState("authenticating");
        else { 
          this.messageBar.flashState("login-unavailable");
          this.extraControls.lock.unlock(this); 
        }
         
      }

    };


    cancelAuthentication = function() {
      this.extraControls.lock.unlock(this);  
      this.extraControls.close();
      this.extraControls.clear();
      this.setState("logged-out");

    };




    submitLogin = async function() {

      const identifier = this.element.querySelector("#identifier").value;
      const password = this.element.querySelector("#password").value;

      try {
        const currentUser = await this.account.login(identifier, password);
        this.extraControls.lock.unlock(this);
        this.extraControls.close();
        this.extraControls.clear();
        this.setState("logged-in", {currentUserName: currentUser.username});
    
      } catch (err) {
        this.extraControls.lock.unlock(this);
        this.extraControls.close();
        this.extraControls.clear();
        this.setState("logged-out");
        let message = "Login failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);

      }

    };

    register = function() {
      this.extraControls.lock.unlock(this);
      this.extraControls.close();
      this.extraControls.setState("registering", null, this.afterExtraRender);
      this.extraControls.open();
      this.extraControls.lock.lock(this);
    };

    submitRegistration = async function() {
      const username = this.element.querySelector("#regUsername").value;
      const email = this.element.querySelector("#regEmail").value;
      const password = this.element.querySelector("#regPassword").value;
      const confirm = this.element.querySelector("#regConfirm").value;

      if (password !== confirm) {
        this.element.querySelector("#regMessage").textContent = "Passwords do not match.";
        return;
      }
      if (username.trim() === "") {
        this.element.querySelector("#regMessage").textContent = "Username is required.";
        return;
      }

      try {
        const currentUser = await this.account.register(username, email, password);
        this.extraControls.lock.unlock(this);
        this.extraControls.close();
        this.extraControls.clear();
        this.setState("logged-in", {currentUserName: currentUser.username});
        
      } catch (err) {
        this.extraControls.lock.unlock(this);
        this.extraControls.close();
        this.extraControls.clear();
        this.setState("logged-out");
        let message = "Registration failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);
      }

    };
    

    submitLogout = async function() {
    
      try {
        await this.account.logout();
        this.setState("logged-out");

      } catch (err) {
        let message = "Log out failed: " + err.message;
        this.dialogueBox.setState("notifying", {message: message}, null);
   
      }  
      
    };


    logout = function() {
      this.dialogueBox.setState(
        "confirming", 
        {confirmation: "Are you sure you want to log out?"}, 
        this.submitLogout, 
        null
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
        <input type="text" id="identifier" placeholder="Username or Email"><br>
        <input type="password" id="password" placeholder="Password"><br>          
        <button id="confirmLoginBtn">Login</button>
        <button id="cancelLoginBtn">Cancel</button>       
        <p><a href="#" id="registerLink">Not a registered user? Set up as a user now...</a></p>
      </div>
    `);

    this.extraControls.defineState("registering",`
      <div class="user-auth">
        <input type="text" id="regUsername" placeholder="Username"><br>
        <input type="email" id="regEmail" placeholder="Email"><br>
        <input type="password" id="regPassword" placeholder="Password"><br>
        <input type="password" id="regConfirm" placeholder="Confirm Password"><br>
        <button id="confirmRegBtn">Register Now</button>
        <button id="cancelRegBtn">Cancel</button>
        <p id="regMessage" style="color:red;"></p>
      </div>
    `);

    this.messageBar.defineState("login-unavailabe",`
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
        this.element.querySelector("#confirmLoginBtn").onclick = this.submitLogin;
        this.element.querySelector("#cancelLoginBtn").onclick = this.cancelAuthentication;    
        this.element.querySelector("#registerLink").onclick = this.register;
      break;

      case "registering":
        this.element.querySelector("#confirmRegBtn").onclick = this.submitRegistration;
        this.element.querySelector("#cancelRegBtn").onclick = this.cancelAuthentication;
        
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
        this.setState("loggedOut");
      } else {

        this.setState("loggedIn", {currentUserName: currentUser.username});
      }

    } catch (err) {
      //Call to check function failed
      //NEED TO HANDLE ERRORS HERE MORE PROPERLY
      this.setState("loggedOut");
    }
  
  }

}




//------------------------------------------------




export class DialogueBoxUIC extends StatefulElement {

// Define event handlers in class field functions before constructor so we can bind(this) in this constructor
  #displaySequence;
  confirmCallback;
  cancelCallback;
    
  dismiss = function () {
    this.clear();
    if(this.confirmCallback){
      this.confirmCallback();
    }
  };

  confirm = function () {
    this.clear();
    if(this.confirmCallback){
      this.confirmCallback();
    }
  };
  
  
  cancel = function () {
    this.clear();
    if(this.cancelCallback){
      this.cancelCallback();
    }
  };


  constructor(element, lock) {

    super(element);
    
    #displaySequence = new AsyncGate();   

    // Bind(this) for the event handlers so that they can be used as such and know about 'this'
    this.dismiss = this.dismiss.bind(this);
    this.confirm = this.confirm.bind(this);
    this.cancel = this.cancel.bind(this);

    // Define the fixed HTML states for this UIC
    this.defineState("notifying",`
      <p>$message</p>
      <button id="dismissPopupBtn">Dismiss</button>
    `);

    this.defineState("confirming",`
      <p>$confirmation</p>
      <button id="confirmPopupBtn">Confirm</button>
      <button id="cancelPopupBtn">Cancel</button>
    `);


  }


  async setState(state, params, confirmCallback, cancelCallback) {

    await this.displaySequence.acquire();

    this.confirmCallback = confirmCallback;
    this.cancelCallback = cancelCallback;

    super.setState(state, params);

  }
  

  afterRender(state) {
  
    // Create event handling for the defined states of this UIC
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
        // No default handlers to be set

    }

  }
  
  
  clear() {
    this.hide();
    super.clear();
    this.displaySequence.release();
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
    await wait(duration);

    // Only the latest flash is allowed to revert
    if (myFlashId === this.flashCounter) {
      this.setState(this.revertState);
      this.revertState = null;
    }
  }

}




//-----------------------------------------------------------------------




export class ExtraControlsUIC extends StatefulElement {

  constructor(element) {
    super(element);
    this.actionSequence = new AsyncGate();
    this.endState = null
    this.isOpen = false;
  }

  async setState(state, params, afterAfterRender) {

    this.endState = state;

    await this.actionSequence.acquire();

    if(this.lock.isInterlocked()){
      this.actionSequence.release();
      return;
    }

    super.setState(state, params);

    if (afterAfterRender) {
      afterAfterRender(state);
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
  

  initiateAddLink = function () {
    //!! TO SET NEW STATE HERE AND IN MAP MANAGER
  };




  constructor(element, messageBar, dialogueBox, extraControls, lock){

    super(element);
    
    this.messageBar = messageBar;
    this.dialogueBox = dialogueBox;
    this.extraControls = extraControls;
    this.lock = lock;

    // Bind(this) for the event handlers so that they can be used as such a know about 'this'
    this.testShowDialogue = this.testShowDialogue.bind(this); 
    this.testOpenExtra = this.testOpenExtra.bind(this); 
    this.testCloseExtra = this.testCloseExtra.bind(this); 
    this.initiateAddLink = this.initiateAddLink.bind(this); 
    
    // Bind this for callbacks 
    this.afterExtraRender = this.afterExtraRender.bind(this);

    // Define the fixed HTML states for this UIC
    this.defineState("testing",`
      <p>ModeSelectorUIC up and running</p>
      <button id="openExtraControlsBtn">Open Extra Controls</button>
      <button id="showDialogueBoxBtn">Show Dialogue Box</button>
    `);

    this.extraControls.defineState("testing-from-modeSelector",`
      <p>ExtraControlsUIC up and running</p>
      <button id="closeExtraControlsBtn">Close</button>
    `);

    this.defineState("segment-selecting",`
      <button id="addLinkBtn">Add Link</button>
    `);

    // DEFINE OTHER REQUIRED STATES HERE

    // INITIATE IN DEFAULT STATE
    this.setState("segment-selecting");

  }

  afterRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "testing":
        this.element.querySelector("#showDialogueBoxBtn").onclick = this.testShowDialogue;
        this.element.querySelector("#openExtraControlsBtn").onclick = this.testOpenExtra;
      break;

      case "segment-selecting":
        this.element.querySelector("#addLinkBtn").onclick = this.initiateAddLink;
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
    this.setState("segment-selecting");

  }
  
  
}


