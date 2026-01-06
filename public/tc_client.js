// Import classes
import { Lock } from './tc_tools.js';
import { Interlocking } from './tc_tools.js';
import { Authenticator } from './tc_auth.js';
import { MessageBarUIC } from './tc_UI.js';
import { UserAccountUIC } from './tc_UI.js';
import { LayersSelectionUIC } from 'tc_UI.js';
import { ModeSelectionUIC } from 'tc_UI.js';
import { InfoSectionUIC } from 'tc_UI.js';
import { ExtraControlsUIC } from './tc_UI.js';
import { DialogueBoxUIC } from './tc_UI.js';


// Get hold of key elements in the HTML
const messageBarHTML = document.getElementById('message-bar');
const userAccountHTML = document.getElementById("user-account");
const layersSelectionHTML = document.getElementById("layers-selection");
const modeSelectionHTML = document.getElementById('mode-selection');
const infoSectionHTML = document.getElementById("info-section");
const extraControlsHTML = document.getElementById('extra-controls');
const dialogueBoxHTML = document.getElementById('dialogue-box');



// Create a new Leaflet map and set the view zoomed on a fixed location (can make that dynamic in future)
const map = L.map('map').setView([51.4, -0.35], 13);

// User authentication handler
const auth = new Authenticator(); 

// Set up interlocking system and locks 
const interlocking =  new Interlocking();
userAccountLock = interlocking.newLock();
modeSelectionLock = interlocking.newLock();
infoSectionLock = interlocking.newLock();
extraControlsLock = interlocking.newLock();
dialogBoxLock = interlocking.newLock();



// Instatiate handlers for UI components
const messageBarUIC = new MessageBarUIC(messageBarHTML);
const userAccountUIC = new UserAccountUIC(userAccountHTML, userAcccountLock, auth);
const layersSelection UIC = new LayersSelectionUIC(layersSelectionHTML);
const modeSelectionUIC = new ModeSelectionUIC(modeSelectionHTML, modeSelectionLock);
const infoSectionUIC = new InfoSectionUIC(infoSectionHTML, infoSectionLock);
const extraControlsUIC = new ExtraControlsUIC(extraControlsHTML, extraControlsLock);
const dialogueBoxUIC = new DialogueBoxUIC(dialogueBoxHTML, dialogueBoxLock);




// Get html elements for legacy example UI functionality - to be replaced
const toggleExtraButton = document.getElementById('toggleExtra');
const showPopupButton = document.getElementById('showPopup');
const closePopupButton = document.getElementById('closePopup');
  


// Initialise Leaflet map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

/* LEGACY User management section

// Initialise user login state 
let userState = "loggedOut";
let currentUserName = null;


function renderUserSection() {
  const section = document.getElementById("user-section");
  section.innerHTML = ""; // clear existing content

  if (userState === "loggedOut") {
    section.innerHTML = `
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
    `;
    document.getElementById("loginBtn").onclick = async function() {

      try {
        const identifier = document.getElementById("identifier").value;
        const password = document.getElementById("password").value;

        const currentUser = await auth.login(identifier, password);

        currentUserName = currentUser.username; 
        userState = "loggedIn";
        renderUserSection();
    
      } catch (err) {
        //Failed login
        userState = "loggedOut";
        renderUserSection();
      }

    };
    document.getElementById("registerLink").onclick = function(e) {
      e.preventDefault();
      userState = "registering";
      renderUserSection();
    };

  } else if (userState === "registering") {
    section.innerHTML = `
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
    `;
    document.getElementById("registerBtn").onclick = async function() {
      const username = document.getElementById("regUsername").value;
      const email = document.getElementById("regEmail").value;
      const password = document.getElementById("regPassword").value;
      const confirm = document.getElementById("regConfirm").value;

      if (password !== confirm) {
        document.getElementById("regMessage").textContent = "Passwords do not match.";
        return;
      }
      if (username.trim() === "") {
        document.getElementById("regMessage").textContent = "Username is required.";
        return;
      }

      try {
        const currentUser = await auth.register(username, email, password);

        currentUserName = currentUser.username; 
        userState = "loggedIn";
        renderUserSection();
      } catch (err) {
        //Failed registration
        //NEED TO SHOW ERROR HERE
        userState = "loggedOut";
        renderUserSection();
      }

    };

    document.getElementById("cancelBtn").onclick = function() {
      userState = "loggedOut";
      renderUserSection();
    };

  } else if (userState === "loggedIn") {
    section.innerHTML = `
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
    `;
    document.getElementById("logoutBtn").onclick = async function() {
      try {
        await auth.logout();

        currentUserName = null; 
        userState = "loggedOut";
        renderUserSection();

      } catch (err) {
        //Failed logout
        //NEED TO CONSIDER DIFFERENT REASONS AND BEHAVIOURS   
   
      }  
    };
  }
}
*/


// EVENT LISTENERS FOR TEMPORARY CONTROLS - TO BE DELETED
showPopupButton.onclick = function() {   
  dialogueBoxUIC.setState("notifying", "message: dialogueBoxUIC up and running");
};

toggleExtraButton.onclick = function() {
  if (extraControlsHTML.style.display === 'none' || extraControlsHTML.style.display === '') {
    extraControlsHTML.style.display = 'block';
  } else {
    extraControlsHTML.style.display = 'none';
  }
};


// Set a startup function to set initial UIC states, including whether userAccount already logged in
//!! Does this need to be asunc here or an await? Is this correctly bound?)
async function startup(){

  messageBarUIC.setState("test-message") 
  userAccountUIC.checkState()

}

window.addEventListener('load', startup());


/* LEGACY TO BE DELETED
window.addEventListener('load', async function () {
  try {
    const currentUser = await auth.check();
  
    if (!currentUser) {
      currentUserName = null;
      userState = "loggedOut";
    } else {
      currentUserName = currentUser.username;
      userState = "loggedIn";
    }

    renderUserSection();

  } catch (err) {
    //Call to check function failed
    //NEED TO HANDLE ERRORS HERE MORE PROPERLY
      currentUserName = null;
      userState = "loggedOut";
      renderUserSection();
  }

});
*/






