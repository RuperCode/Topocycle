// Import classes
//import { Lock } from './tc_tools.js'; //Possibly not needed as Locks instantiated inside Interlocking
import { Interlocking } from './tc_tools.js';
import { Authenticator } from './tc_auth.js';
import {
  MessageBarUIC,
  UserAccountUIC,
  LayerManagerUIC,
  ModeSelectorUIC,
  //InfoSectionUIC
  ExtraControlsUIC,
  DialogueBoxUIC,
  MapManagerUIC
} from './tc_UI.js';


// Get hold of key elements in the HTML
const messageBarHTML = document.getElementById('message-bar');
const userAccountHTML = document.getElementById("user-account");
const layerManagerHTML = document.getElementById("layers-selection");
const modeSelectorHTML = document.getElementById('mode-selection');
const infoSectionHTML = document.getElementById("info-section");
const extraControlsHTML = document.getElementById('extra-controls');
const dialogueBoxHTML = document.getElementById('dialogue-box');
const mapManagerHTML = document.getElementById('map');



// User authentication handler
const auth = new Authenticator(); 

// Set up interlocking system and locks 
const interlocking =  new Interlocking();
const userAccountLock = interlocking.newLock();
const layerManagerLock = interlocking.newLock();
const modeSelectorLock = interlocking.newLock();
// const infoSectionLock = interlocking.newLock();
const extraControlsLock = interlocking.newLock();
// const dialogueBoxLock = interlocking.newLock();
const mapManagerLock = interlocking.newLock();



// Instatiate handlers for UI components
const messageBar = new MessageBarUIC(messageBarHTML);
const dialogueBox = new DialogueBoxUIC(dialogueBoxHTML);
const extraControls = new ExtraControlsUIC(extraControlsHTML, extraControlsLock);
const userAccount = new UserAccountUIC(userAccountHTML, messageBar, dialogueBox, extraControls, userAccountLock, auth);
const mapManager =  new MapManagerUIC(mapManagerHTML, mapManagerLock);
const layerManager = new LayerManagerUIC(layerManagerHTML, messageBar, dialogueBox, extraControls, mapManager, layerManagerLock, userAccount.getCurrentUserID);
const modeSelector = new ModeSelectorUIC(modeSelectorHTML, mapManager, messageBar, dialogueBox, extraControls, layerManager, modeSelectorLock);
//const infoSection = new InfoSectionUIC(infoSectionHTML, infoSectionLock);



// Set a startup function to set initial UIC states, including whether userAccount already logged in
//!! Does this need to be asunc here or an await? Is this correctly bound?)
function startup(){

  messageBar.setState("test-message");
  modeSelector.setState("testing");
  userAccount.checkState();
  layerManager.init();
  mapManager.initMap();
}

window.addEventListener('load', startup);

