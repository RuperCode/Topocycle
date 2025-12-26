// Import classes
import { Authenticator } from './tc_auth.js';


// Key instantiations
const map = L.map('map').setView([51.4, -0.35], 13); //creates a new Leaflet map and sets the view zoomed on a fixed location (can make that dynamic in future)
const user = new Authenticator(); //Authentication module

// Get crucial html elements
const extraControls = document.getElementById('extra-controls');
const popup = document.getElementById('popup');
const toggleExtraButton = document.getElementById('toggleExtra');
const showPopupButton = document.getElementById('showPopup');
const closePopupButton = document.getElementById('closePopup');

// Initialize Leaflet map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Initialise user login state 
let userState = "loggedOut"; // "loggedOut", "registering", "loggedIn"
let currentUserName = null;


// User management section
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

        const currentUser = await user.login(identifier, password);

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
        const currentUser = await user.register(username, email, password);

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
        await user.logout();

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

// Call once at startup

window.addEventListener('load', async function () {
  try {
    const currentUser = await user.check();

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




// Toggle extra controls
toggleExtraButton.onclick = function() {
  if (extraControls.style.display === 'none' || extraControls.style.display === '') {
    extraControls.style.display = 'block';
  } else {
    extraControls.style.display = 'none';
  }
};

// Show popup
showPopupButton.onclick = function() {
  popup.style.display = 'block';
};

// Close popup
closePopupButton.onclick = function() {
  popup.style.display = 'none';
};