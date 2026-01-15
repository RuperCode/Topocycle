import { StatefulElement, AsyncGate } from './tc_tools.js';
import { wait, waitForTransition} from './tc_tools.js';


export class UserAccountUIC extends StatefulElement {

// Define event handlers in class field functions before constructor so we can bind(this) in this constructor

    login = async function() {

      const identifier = this.element.querySelector("#identifier").value;
      const password = this.element.querySelector("#password").value;

      try {
        const currentUser = await this.account.login(identifier, password);

        this.setState("loggedIn", {currentUserName: currentUser.username});
    
      } catch (err) {
        //Failed login
        //!! NEED TO SHOW ERROR HERE
        this.setState("loggedOut");
      }

    };

    register = function() {
      this.setState("registering");
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

        this.setState("loggedIn", {currentUserName: currentUser.username});
        
      } catch (err) {
        //Failed registration
        //NEED TO SHOW ERROR HERE
        this.setState("loggedOut");
      }

    };
    
    cancelRegistration = function() {
      this.setState("loggedOut");
    };

    logout = async function() {
    
      //!! ADD AN 'ARE YOU SURE' CYCLE
      try {
        await this.account.logout();
        
        this.setState("loggedOut");

      } catch (err) {
        //Failed logout
        //!! NEED TO CONSIDER DIFFERENT REASONS AND BEHAVIOURS   
   
      }  
      
    };


  constructor(element, messageBar, dialogueBox, extraControls, lock, account) {

    super(element);


    this.messageBar = messageBar;
    this.dialogueBox = dialogueBox; 
    this.extraControls = extraControls;
    this.lock = lock;
    this.account = account;

 // Bind(this) for the event handlers so that they can be used as such a know about 'this'

    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.submitRegistration = this.submitRegistration.bind(this);
    this.cancelRegistration = this.cancelRegistration.bind(this);
    this.logout = this.logout.bind(this);


    // Define the fixed HTML states for this UIC
    this.defineState("loggedOut",`
      <h3>User</h3>
      <div class="user-box">
        <div class="user-left">
          <div class="user-icon red"><i class="fas fa-user"></i></div>
          <p>Unknown user</p>
        </div>
        <div class="user-right">
          <input type="text" id="identifier" placeholder="Username or Email"><br>
          <input type="password" id="password" placeholder="Password"><br>          
          <button id="loginBtn">Login</button>
          <p><a href="#" id="registerLink">Not a registered user? Set up as a user now...</a></p>
        </div>
      </div>
    `);

    this.defineState("loggedIn",`
      <h3>User</h3>
      <div class="user-box">
        <div class="user-left">
          <div class="user-icon green"><i class="fas fa-user"></i></div>
          <p>$currentUserName</p>
        </div>
        <div class="user-right">
          <button id="logoutBtn">Logout</button>
        </div>
      </div>
    `);

    this.defineState("registering",`
      <h3>Register</h3>
      <div class="user-box">
        <div class="user-left">
          <div class="user-icon amber"><i class="fas fa-user"></i></div>
          <p>Registering...</p>
        </div>
        <div class="user-right">
          <input type="text" id="regUsername" placeholder="Username"><br>
          <input type="email" id="regEmail" placeholder="Email"><br>
          <input type="password" id="regPassword" placeholder="Password"><br>
          <input type="password" id="regConfirm" placeholder="Confirm Password"><br>
          <button id="registerBtn">Register Now</button>
          <button id="cancelBtn">Cancel</button>
          <p id="regMessage" style="color:red;"></p>
        </div>
      </div>
    `);



  }

  afterRender(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "loggedOut":
        this.element.querySelector("#loginBtn").onclick = this.login;
        this.element.querySelector("#registerLink").onclick = this.register;
      break;

      case "loggedIn":
        this.element.querySelector("#logoutBtn").onclick = this.logout;
      break;

      case "registering":
        this.element.querySelector("#registerBtn").onclick = this.submitRegistration;
        this.element.querySelector("#cancelBtn").onclick = this.cancelRegistration;
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

  dismiss = function () {
    this.clear();
  };

  confirm = function () {
    try {
      //!! DO A THING
      if ( this.lock.unlock() ) {
        this.clear();
      } else {
        //!! Deal with failed unlock
      }
    } catch (err) {
      //!! CHECK HOW STATEFULENTITY RECEIVES PARAMETERS
      this.lock.unlock();
    }
  };
  
  
  cancel = function () {
    //!! DO A THING
    //!! SHOULD THE SHOW/HIDE BE STATE LINKED?
    this.lock.unlock();
    this.clear();
  };


  constructor(element, lock) {

    super(element);
    
    this.lock = lock; 

    // Bind(this) for the event handlers so that they can be used as such a know about 'this'
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
    this.isOpen = false;
  }

  async setState(state, params, afterAfterRender) {

    await this.actionSequence.acquire();

    super.setState(state, params);

    if (afterAfterRender) {
      afterAfterRender(state);
    }

    this.actionSequence.release();
  }

  async clear() {

    await this.actionSequence.acquire();

    super.clear();

    this.actionSequence.release();
  }

  async open() {

    await this.actionSequence.acquire();

    if (!this.isOpen) {
      this.isOpen = true;
      this.element.classList.add('shown');
      await waitForTransition(this.element);
    }

    this.actionSequence.release();
  }

  async close() {

    await this.actionSequence.acquire();

    if (this.isOpen) {
      this.isOpen = false;
      this.element.classList.remove('shown');
      await waitForTransition(this.element);
    }

    this.actionSequence.release();
  }
}




//-----------------------------------------------------------------------



export class ModeSelectionUIC extends StatefulElement {


// Define event handlers in class field functions before constructor so we can bind(this) in this constructor
  testShowDialogue = function () {
    this.dialogueBox.setState("notifying", {message: "DialogueBoxUIC up and running"});
  }

  testOpenExtra = async function () {
    if(this.extraControls.getState() === "testing-from-modeSelector"){
      this.extraControls.open();
    } else {
      try {
        this.extraControls.close();
        this.extraControls.setState("testing-from-modeSelector", null, this.afterExtraRender);
        this.extraControls.open();

      } catch {
        //!! HANDLE A THROW EG IF STATE IS LOCKED
      }
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


