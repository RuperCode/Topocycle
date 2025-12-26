import { StatefulElement } from './tc_tools.js';

class UserAccountUIC extends StatefulElement {

  constructor(element, user) {

    super(element);

    this.user = user;

    super.defineState("loggedOut","");

    super.defineState("loggedIn","");

    super.defineState("registering","");

    this.register = function () {
      // ADD HANDLING CODE
    };

    this.login = function () {
      // ADD HANDLING CODE
    };

    this.logout = function () {
      // ADD HANDLING CODE
    };

    this.cancelRegistration = function () {
      // ADD HANDLING CODE
    };
  }

  setState(state) {
     
    switch (state) {
      case "loggedOut":
        super.setState(state);
        // SET EVENT HANDLERS
      break;

      case "loggedIn":
        super.setState(state, params);
        // SET EVENT HANDLERS
      break;

      case "registering":
        super.setState(state);
        // SET EVENT HANDLERS
      break;

      default:
        super.setState(state);

    }

  }

}
