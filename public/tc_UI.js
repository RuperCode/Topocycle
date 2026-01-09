import { StatefulElement } from './tc_tools.js';
import { Lock } from './tc_tools.js';
import { wait } from './tc_tools.js';


class UserAccountUIC extends StatefulElement {

  constructor(element, account) {

    super(element);

    this.account = account;

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
          <input type="text" id="password" placeholder="Password"><br>          
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
          <p>${currentUserName}</p>
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



    // Define core functionality of this UIC in class field functions 

    this.login = async function () {

      const identifier = this.element.getElementById("identifier").value;
      const password = this.element.getElementById("password").value;

      try {
        const currentUser = await this.account.login(identifier, password);

        this.setState("loggedIn", {currentUserName: currentUser.username});
    
      } catch (err) {
        //Failed login
        //!! NEED TO SHOW ERROR HERE
        this.setState("loggedOut");
      }

    };

    this.register = async function () {
      this.setState("registering");
    };

    this.submitRegistration = async function () {
      const username = this.element.getElementById("regUsername").value;
      const email = this.element.getElementById("regEmail").value;
      const password = this.element.getElementById("regPassword").value;
      const confirm = this.element.getElementById("regConfirm").value;

      if (password !== confirm) {
        this.element.getElementById("regMessage").textContent = "Passwords do not match.";
        return;
      }
      if (username.trim() === "") {
        this.element.getElementById("regMessage").textContent = "Username is required.";
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
    
    this.cancelRegistration = async function () {
      this.setState("loggedOut");
    };

    this.logout = async function () {
    
      //!! ADD AN 'ARE YOU SURE' CYCLE
      try {
        await this.account.logout();
        
        this.setState("loggedOut");

      } catch (err) {
        //Failed logout
        //!! NEED TO CONSIDER DIFFERENT REASONS AND BEHAVIOURS   
   
      }  
      
    };

  }

  setState(state) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {
      case "loggedOut":
        super.setState(state);
        //!! CHECK IF this.element WORKS
        this.element.getElementById("loginBtn").onclick = this.login;
        this.element.getElementById("registerLink").onclick = this.register;
      break;

      case "loggedIn":
        super.setState(state, params);
        this.element.getElementById("logoutBtn").onclick = this.logout;
      break;

      case "registering":
        super.setState(state);
        this.element.getElementById("registerBtn").onclick = this.submitRegistration;
        this.element.getElementById("cancelBtn").onclick = this.cancelRegistration;
        
        
      break;

      default:
        super.setState(state);

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




class DialogueBoxUIC extends StatefulElement {

  constructor(element, lock) {

    super(element);
    
    this.lock = lock; 

    // Define the fixed HTML states for this UIC
    this.defineState("notifying",`
      <p>${message}</p>
      <button id="dismissPopupBtn">Dismiss</button>
    `);

    this.defineState("confirming",`
      <p>${confirmation}</p>
      <button id="confirmPopupBtn">Confirm</button>
      <button id="cancelPopupBtn">Cancel</button>
    `);

    // Define core functionality of thus UIC in class field functions 

    this.dismiss = function () {
        this.clear();
    };

    this.confirm = async function () {
      try {
        //!! DO A THING
        if ( this.lock.unlock() ) {
          this.clear();
        } else {
          //!! Deal with failed unlock
        }
      } catch (err) {
        //!! CHECK HOW STATEFULENTITY RECEIVES PARAMETERS
        this.unlock();
on 
      }
    };
    
    
    this.cancel = async function () {
      //!! DO A THING
      //!! SHOULD THE SHOW/HIDE BE STATE LINKED?
      this.unlock();
      this.clear();
    };

  }

  setState(state, params) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

      case "notifying":
        super.setState(state, params);
        this.element.getElementById("dismissPopupBtn").onclick = this.dismiss;
        this.show();
      break;

      case "confirming":
        super.setState(state, params);
        this.element.getElementById("confirmPopupBtn").onclick = this.confirm;
        this.element.getElementById("cancelPopupBtn").onclick = this.cancel;
        this.show();
      break;o

      default:
        super.setState(state);

    }

  }
  
  
  clear() {
    this.hide;
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




class MessageBarUIC extends StatefulElement {

  constructor(element) {
    super(element);

    this.defineState("test-message", "<p>Message Bar UIC up and running</p>");

  }

  async flashState(state, duration = 6000) {
  
        const lastState = this.currentState;
        this.setState(state);

        await wait(duration); 

        this.setState(lastState);
    }
}




//-----------------------------------------------------------------------






class ExtraControlsUIC extends StatefulElement {

  // extended only for open/close functionality
  
  clear() {
    
    this.close;
    super.clear();

  }
  
  open() {
    //!! NEED TO ADD ANIMATION 
    this.element.style.display = 'block';
  }
  
  close() {
    //!! NEED TO ADD ANIMATION 
    this.element.style.display = 'none';
  }

} 



//-----------------------------------------------------------------------



class ModeSelectionUIC extends StatefulElement {

  constructor(element, dialogueBox, extraControls, lock){

    super(element);
    
    this.dialogueBox = dialogueBox;
    this.extraControls = extraControls;
    this.lock = lock;

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

    // Define core functionality of this UIC in class field functions 

    this.testShowDialogue = function () {
      this.dialogueBox.setState("notifying", {message: "DialogueBoxUIC up and running"});
    }

    this.testOpenExtra = async function () {
      if(this.extraControls.getState() === "testing-from-modeSelector"){
        this.extraControls.open();
      } else {
        try {
          await this.extraControls.clear();
          this.extraControls.setState("testing-from-modeSelector");
          this.extraControls.element.getElementById("closeExtraControlsBtn").onclick = this.testCloseExtra;
        } catch {
          //!! HANDLE A THROW EG IF STATE IS LOCKED
        }
      }
    };

    this.testCloseExtra = function () {
      this.extraControls.close();
    };
    

    this.initiateAddLink = function () {
      //!! TO SET NEW STATE HERE AND IN MAP MANAGER
    };


  }

  setState(state, params) {
  
    // Create event handling for the defined states of this UIC in addition to setting the HTML state in the super class
    switch (state) {

//!! NEED TO MOVE THE SUPER CALL OUTSIDE THE CASE?
      case "testing":
      //!! UPDATE THE BELOW
        super.setState(state, params);
        this.element.getElementById("showDialogueBoxBtn").onclick = this.testShowDialogue;
        this.element.getElementById("openExtraControlsBtn").onclick = this.testOpenExtra;
      break;

      case "segment-selecting":
      //!! UODATE THE BELOW
        super.setState(state, params);
        this.element.getElementById("addLinkBtn").onclick = this.initiateAddLink;
      break;

      default:
        super.setState(state);

    }

  }
  
  
  clear() {
    // Overridden to effect a default state
    this.setState("segment-selecting");

  }
  
  
}


