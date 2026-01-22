// Import classes
//import { Lock } from './tc_tools.js'; //Possibly not needed as Locks instantiated inside Interlocking
import { Interlocking } from './tc_tools.js';
import { Authenticator } from './tc_auth.js';
import {
  MessageBarUIC,
  UserAccountUIC,
  //LayersSelectionUIC
  ModeSelectionUIC,
  //InfoSectionUIC
  ExtraControlsUIC,
  DialogueBoxUIC,
  MapManagerUIC
} from './tc_UI.js';


// Get hold of key elements in the HTML
const messageBarHTML = document.getElementById('message-bar');
const userAccountHTML = document.getElementById("user-account");
const layersSelectionHTML = document.getElementById("layers-selection");
const modeSelectionHTML = document.getElementById('mode-selection');
const infoSectionHTML = document.getElementById("info-section");
const extraControlsHTML = document.getElementById('extra-controls');
const dialogueBoxHTML = document.getElementById('dialogue-box');
const mapManagerHTML = document.getElementById('map');



// User authentication handler
const auth = new Authenticator(); 

// Set up interlocking system and locks 
const interlocking =  new Interlocking();
const userAccountLock = interlocking.newLock();
const modeSelectionLock = interlocking.newLock();
const infoSectionLock = interlocking.newLock();
const extraControlsLock = interlocking.newLock();
const dialogueBoxLock = interlocking.newLock();
const mapManagerLock = interlocking.newLock();



// Instatiate handlers for UI components
const messageBarUIC = new MessageBarUIC(messageBarHTML);
const dialogueBoxUIC = new DialogueBoxUIC(dialogueBoxHTML, dialogueBoxLock);
const extraControlsUIC = new ExtraControlsUIC(extraControlsHTML, extraControlsLock);
const userAccountUIC = new UserAccountUIC(userAccountHTML, messageBarUIC, dialogueBoxUIC, extraControlsUIC, userAccountLock, auth);
//const layersSelectionUIC = new LayersSelectionUIC(layersSelectionHTML);
const mapManagerUIC =  new MapManagerUIC(mapManagerHTML, mapManagerLock);
const modeSelectionUIC = new ModeSelectionUIC(modeSelectionHTML, mapManagerUIC, messageBarUIC, dialogueBoxUIC, extraControlsUIC, modeSelectionLock);
//const infoSectionUIC = new InfoSectionUIC(infoSectionHTML, infoSectionLock);



// Set a startup function to set initial UIC states, including whether userAccount already logged in
//!! Does this need to be asunc here or an await? Is this correctly bound?)
function startup(){

  messageBarUIC.setState("test-message");
  modeSelectionUIC.setState("testing");
  userAccountUIC.checkState();
  mapManagerUIC.initMap();
}

window.addEventListener('load', startup);

