'use strict';

/** Class representing the identity module */
class Identity {
  /**
   * Initializes the identity class module, renders the additional actions
   */
  constructor() {
    this.loggedIn = false;

    const userActionContainer = `
    <div class="ts-user-actions-container">
        <div class="icon ts-open-actions" role="button">
          <i class="fa fa-cog"></i>
          <h6>User Actions</h6>
        </div>
        <div class="d-flex ts-user-actions"> </div>
      </div>`;

    $(`.icon-nav`).prepend(userActionContainer);

    let encodedJWT = Cookies.get(`UserJWT`)
    if(encodedJWT) {
      // Logged in
      this.loggedIn = true;

      // get the user's id and username from the JWT
      const JWT = decodeJWT(encodedJWT);

      this.id = JWT.user_id;
      this.username = JWT.username;

      addUserActions([ userActions.manageDatabase, userActions.manageSession, userActions.logout, ]);
    } else {
      // Not logged in
      addUserActions([ userActions.login, userActions.signup, ]);
    }

    // insert a blank modal into the DOM
    const universalModal = `
      <div class="modal fade" id="ts-modal" tabindex="-1" role="dialog" aria-labelledby="modal-header" aria-hidden="true">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="model-header"></h5>
              <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer"></div>
          </div>
        </div>
      </div>`;

    $(`body`).prepend(universalModal);
  }

  /**
   * Login using username and password
   * @param {string} username - the username
   * @param {string} password - the password
   *
   * @return {object} - returns a promise object
   */
  login(username, password) {
    return new Promise((resolve, reject) => {

      const xhr = new XMLHttpRequest();
      xhr.open(`POST`, `../src/routing.php?action=login&username=${username}&password=${password}`);

      xhr.onload = function(e) {
        if(this.status === 200) {
          resolve();
        }

        if(this.status === 400) {
          addModalValidation(`One or more fields are not valid!`);
          reject();
        }

        if(this.status === 401) {
          addModalValidation(`Incorrect username or password!`);
          reject();
        }

        if(this.status === 500) {
          addModalValidation(this.response);
          reject();
        }
      };

      xhr.send();
    });
  }

  /**
   * Signup and login to application
   * @param {string} email    - the email
   * @param {string} username - the username
   * @param {string} password - the password
   *
   * @return {object} - returns a promise object
   */
  signup(email, username, password) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(`GET`, `signup.php?email=${email}&username=${username}&password=${password}`)

      xhr.onload = function(e) {
        if(this.status === 200) {
          const uint8 = new Uint8Array(this.response);
          testSQL.loadUint8Array(uint8, resolve, reject);

          resolve();
        }

        const $email = $(`#ts-email`);
        const $username = $(`#ts-username`);
        const $password = $(`#ts-password`);

        if(this.status === 400) {
          addModalValidation(`One or more fields are not populated!`);
          reject();
        }

        if(this.status === 401) {
          // validation failed server side
          addModalValidation(`One or more fields are not valid!`);
          reject();
        }

        if(this.status === 409) {
          if(this.response == 'username-taken') {
            addModalInputValidation($username, `Username already in-use!`);
          }
          if(this.response == 'email-taken') {
            addModalInputValidation($email, `Email already in-use!`);
          }
          reject();
        }

        if(this.status === 500) {
          addModalValidation(this.response);
          reject();
        }
      };

      xhr.send();
    });
  }

  /**
   * Save the current database to the database
   *
   * @return {object} - returns a promise object
   */
  save() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(`POST`, `../src/routing.php?action=saveDatabase`);

      xhr.onload = function(e) {
        if(this.status === 200) {
          alert('SAVED');
          resolve();
        }

        reject(Error(this.response));
      }

      const blob = new Blob([ts.db.export()], {type: `application/x-sqlite-3`});
      xhr.send(blob);
    });
  }

  /**
   * Load a database
   * @param {integer} id    - the primary key (id) of the database
   *
   * @return {object} - returns a promise object
   */
  load(id) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(`POST`, `../src/routing.php?action=loadDatabase&id=${id}`);
      xhr.responseType = `arraybuffer`;

      xhr.onload = () => {
        if(xhr.status === 200) {
          testSQL.loadUint8Array(new Uint8Array(xhr.response), resolve, reject);
          resolve();
        }

        reject(Error(xhr.reponse));
      }

      xhr.send();
    });
  }

  /**
   * List all databases currently saved
   *
   * @return {array} - returns an array of the databases associated with the user
   */
   getSavedDatabases() {
     return new Promise((resolve, reject) => {
       const xhr = new XMLHttpRequest();

       xhr.open(`POST`, `../src/routing.php?action=getAllDatabases`);
       xhr.responseType = `json`;

       xhr.onload = () => {
         if(xhr.status === 200) {
           resolve(xhr.response);
         }

         reject(Error(xhr.reponse));
       }

       xhr.send();
     });
   }
}

/**
 * Decode the JSON Web Token (JWT)
 * @param {string} token - the web token
 *
 * @return {object} - returns the payload from the JWT
 */
const decodeJWT = (token) => {
  return JSON.parse(atob(token.split(`.`)[1]));
}

/**
 * Adds action icons to the "User actions" sidebar icon
 * @param {array} actions - the array of objects containing icon information
 */
const addUserActions = (actions) => {
  let html = ``;

  for(const {className, icon, heading, onClick} of actions) {
    html = `${html}
      <div class="icon ${className}" ${onClick ? `role="button" data-toggle="modal" data-target="#ts-modal"` : ``}>
        <i class="fa ${icon}"></i>
        <h6>${heading}</h6>
      </div>`;
    if(onClick) {
      $(`.ts-user-actions`).on(`click`, `.${className}`, onClick);
    }
  }

  $(`.ts-user-actions`).append(html);
}

/**
 * Removes all the action icon from the "User actions" sidebar icon
 */
const clearUserActions = () => {
  $(`.ts-user-actions`).html(``);
}

/**
 * Populate the modal before showing
 * @param {string} header   - the header text of the model
 * @param {string} body     - the html body of the model
 * @param {string} footer   - the footer of the model
 */
const populateModal = (header, body, footer) => {
  $(`#ts-modal .modal-title`).html(header);

  const modalValidation = `<div class="form-feedback alert alert-dismissible" style="display: none;"></div>`;
  $(`#ts-modal .modal-body`).html(modalValidation + body);
  $(`#ts-modal .modal-footer`).html(footer);
}

/**
 * Add validation response to an input in the model
 * @param {string} $selector        - the jQuery object representing the DOM object of the input
 * @param {string} validationText   - the text that will be displayed
 * @param {string} validationStyle  - the style of validation (e.g. danger, success, warning)
 */
const addModalInputValidation = ($selector, validationText, validationStyle = `danger`) => {
  $selector.parent().addClass(`has-${validationStyle}`);
  $selector.addClass(`form-control-${validationStyle}`)
  $selector.next().html(validationText);
}

/**
 * Add validation response to the model
 * @param {string} validationText   - the text that will be displayed
 * @param {string} validationStyle  - the style of validation (e.g. danger, success, warning)
 */
const addModalValidation = (validationText, validationStyle = `danger`) => {
  $(`.form-feedback`).addClass(`alert-${validationStyle}`).html(validationText).show();
}

/**
 * Clears all the validation responses in the model
 * @param {string} $selector        - the jQuery object representing the DOM object of the input
 * @param {string} validationText   - the text that will be displayed
 * @param {string} validationStyle  - the style of validation (e.g. danger, success, warning)
 */
const clearAllModalValidation = () => {
  $(`.form-group`).removeClass(`has-danger has-success has-warning`);
  $(`.form-control-feedback`).html(``);

  $(`.form-feedback`).hide();
}

// User actions object of objects
const userActions = {
  login : {
    className: `ts-login-icon`,
    icon: `fa-user`,
    heading: `Login`,
  },
  logout : {
    className: `ts-logout-icon`,
    icon: `fa-sign-out`,
    heading: `Logout`,
  },
  signup : {
    className: `ts-signup-icon`,
    icon: `fa-user-plus`,
    heading: `Sign up`,
  },
  manageSession : {
    className: `ts-join-icon`,
    icon: `fa-group`,
    heading: `Sessions`,
  },
  manageDatabase : {
    className: `ts-save`,
    icon: `fa-database`,
    heading: `Databases`,
  },
};

userActions.login.onSubmit = () => {
  clearAllModalValidation();

  const $username = $(`#ts-username`);
  const $password = $(`#ts-password`);

  let hasErrors = false;

  if(!$username[0].validity.valid) {
    hasErrors = true;

    addModalInputValidation($username, $username[0].validationMessage);
  }

  if(!$password[0].validity.valid) {
    hasErrors = true;

    addModalInputValidation($password, $password[0].validationMessage);
  }

  if(hasErrors === false) {
    identity.login($username.val(), $password.val()).then((response) => {
      // remove the login icon!
      $(`#ts-modal .modal-body`).html(`<small class="text-success">Welcome back, ${$username.val()}!</small>`)

      setTimeout(() => $(`#ts-modal`).modal(`hide`), 1000);

      clearUserActions();

      addUserActions([ userActions.manageDatabase, userActions.manageSession, userActions.logout, ]);
    });
  }
}

userActions.login.onClick = () => {
  const header = `Login`;
  const body = `
    <div class="form-group">
      <label for="ts-username">Username</label>
      <input type="text" class="form-control" id="ts-username" placeholder="Enter your username" required>
      <div class="form-control-feedback"></div>
    </div>
    <div class="form-group">
      <label for="ts-password">Password</label>
      <input type="password" class="form-control" id="ts-password" placeholder="Enter your password" required>
      <div class="form-control-feedback"></div>
    </div>`;
  const footer = `<button type="button" class="btn btn-primary" id="ts-login">Login</button>`;

  populateModal(header, body, footer);

  $(`#ts-login`).off(`click`).on(`click`, userActions.login.onSubmit)
}

userActions.signup.onSubmit = () => {
  clearAllModalValidation();

  const $email = $(`#ts-email`);
  const $username = $(`#ts-username`);
  const $password = $(`#ts-password`);
  const $confirmPassword = $(`#ts-confirm-password`);

  let hasErrors = false;

  if(!$email[0].validity.valid) {
    hasErrors = true;

    addModalInputValidation($email, $email[0].validationMessage);
  }

  if(!$username[0].validity.valid) {
    hasErrors = true;

    addModalInputValidation($username, $username[0].validationMessage);
  }

  if(!$password[0].validity.valid) {
    hasErrors = true;

    addModalInputValidation($password, $password[0].validationMessage);
  }

  if(!$confirmPassword[0].validity.valid || $confirmPassword.val() !== $password.val()) {
    hasErrors = true;

    addModalInputValidation($confirmPassword, $confirmPassword[0].validationMessage || `Passwords don't match`);
  }

  if(hasErrors === false) {
    identity.signup($email.val(), $username.val(), $password.val()).then((response) => {
      $(`#ts-modal .modal-body`).html(`<small class="text-success">Welcome, ${$username.val()}!</small>`)

      setTimeout(() => $(`#ts-modal`).modal(`hide`), 1000);

      clearUserActions();

      addUserActions([ userActions.manageDatabase, userActions.manageSession, userActions.logout, ]);
    });
  }
}

userActions.signup.onClick = () => {
  const header = `Sign up`;
  const body = `
    <div class="form-group">
      <label for="ts-username">Email</label>
      <input type="email" class="form-control" id="ts-email" placeholder="Enter an email" required>
      <div class="form-control-feedback"></div>
      <small class="form-text text-muted">Your email will be used to recover your password if needed.</small>
    </div>
    <div class="form-group">
      <label for="ts-username">Username</label>
      <input type="text" class="form-control" id="ts-username" placeholder="Enter a username" pattern="[A-Za-z0-9-_]{8,20}" required>
      <div class="form-control-feedback"></div>
      <small class="form-text text-muted">Your username can be between 8-20 characters long, containing only letters, numbers, underscores, and dashes.</small>
    </div>
    <div class="form-group">
      <label for="ts-password">Password</label>
      <input type="password" class="form-control" id="ts-password" placeholder="Enter a password" pattern="[\\w]{8,20}" required>
      <div class="form-control-feedback"></div>
      <small class="form-text text-muted">Your password must be 8-20 characters long.</small>
    </div>
    <div class="form-group">
      <label for="ts-password">Confirm Password</label>
      <input type="password" class="form-control" id="ts-confirm-password" placeholder="Confirm your password" required>
      <div class="form-control-feedback"></div>
    </div>`;
  const footer = `<button type="button" class="btn btn-primary" id="ts-signup">Sign up</button>`;

  populateModal(header, body, footer);

  $(`#ts-signup`).off(`click`).on(`click`, userActions.signup.onSubmit)
}

userActions.manageDatabase.onClick = () => {
  const header = `Manage Databases`;
  let body = `No stored databases found`;
  identity.getSavedDatabases().then((response) => {
    body = `
      <table class="table table-hover">
        <thead class="thead-inverse">
          <tr>
            <th> # </th>
            <th> Created </th>
            <th> Actions </th>
          </tr>
        </thead>`;
    response.forEach((val) => {
      let createdDate = new Date(val.Created).toLocaleString(`en-GB`);
      body = body + `
        <tr>
          <th scope="row">${val.ID}</th>
          <td>${createdDate}</td>
          <td class="text-right">
            <span class="ts-load px-1" data-id="${val.ID}" role="button" title="Load database"><i class="fa fa-download"></i></span>
            <span class="ts-remove px-1" data-id="${val.ID}" role="button" title="Remove database" onclick="return confirm('Are you sure you want to PERMANENTLY remove this database?');"><i class="fa fa-trash-o"></i></span>
          </td>
        </tr>`;
    });
    body = body + `</table>`;

    $(`#ts-modal .modal-body`).html(body);

    $(`.ts-load`).off(`click`).on(`click`, function() {
      if(!confirm('Loading a database will REPLACE your current database, are you sure you want to continue?')) return false;

      const db_id = $(this).data(`id`);

      identity.load(db_id).then((response) => {

      });
    });
  });

  const footer = `<button type="button" class="btn btn-primary" id="ts-save">Save current database</button>`;

  populateModal(header, body, footer);

  $(`#ts-save`).off(`click`).on(`click`, () => {
    identity.save().then((response) => {
      console.log(response);
    });
  });
}

// Handles the click event, show/hide
$(`.icon-nav`).on(`click`, `div.ts-open-actions`, () => {
  $(`.ts-user-actions`).toggleClass(`open`)
});

let identity = new Identity();
