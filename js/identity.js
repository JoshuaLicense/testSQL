// Identity class
class Identity {
  constructor() {
    $(`.icon-nav`).prepend(userActionContainer);

    // TODO: Based on jwt
    addUserAction([
      userActions.login,
      userActions.signup,
    ]);

    $(`body`).prepend(universalModal);
  }

  login(username, password) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(`GET`, `login.php?username=${username}&password=${password}`);
      xhr.responseType = `arraybuffer`;

      xhr.onload = function(e) {
        if(this.status === 200) {
          const uint8 = new Uint8Array(this.response);
          testSQL.loadUint8Array(uint8, resolve, reject);

          resolve();
        }

        const $username = $(`#ts-username`);
        const $password = $(`#ts-password`);

        if(this.status === 400) { // not set when sent to server
          addModalValidation($username, `danger`, `Please enter a username!`);
          addModalValidation($password, `danger`, `Please enter a password!`);
          reject();
        }

        if(this.status === 401) { // credentials not correct
            addModalValidation($username, `danger`, `Incorrect username or password!`);
            addModalValidation($password, `danger`, `Incorrect username or password!`);
            reject();
        }

        if(this.status === 404) { // no saved database or not found
          resolve();
        }
      };

      xhr.send();
    });
  }

  static decodeJWT(token) {
    return JSON.parse(atob(token.split(`.`)[1]));
  }
}

// User actions
const userActionContainer = `
<div class="ts-user-actions-container">
    <div class="icon ts-open-actions" role="button">
      <i class="fa fa-cog"></i>
      <h6>User Actions</h6>
    </div>
    <div class="d-flex ts-user-actions"> </div>
  </div>`;

// User actions object of objects
let userActions = {
  login : {
    className: `ts-login-icon`,
    icon: `fa-user`,
    heading: `Login`,
  },
  logout : {
    className: `ts-logout-icon`,
  },
  signup : {
    className: `ts-signup-icon`,
    icon: `fa-user-plus`,
    heading: `Sign up`,
  },
  join_session : {
    className: `ts-join-icon`,
    icon: `fa fa-group`,
    heading: `Joining a session`,
  },
  create_session : {

  },
  manage_session : {

  },
  leave_session : {

  },
};

userActions.login.onSubmit = () => {
  clearModalValidation();

  const $username = $(`#ts-username`);
  const $password = $(`#ts-password`);

  let hasErrors = false;

  if(!$username[0].validity.valid) {
    hasErrors = true;

    addModalValidation($username, `danger`, $username[0].validationMessage);
  }

  if(!$password[0].validity.valid) {
    hasErrors = true;

    addModalValidation($password, `danger`, $password[0].validationMessage);
  }

  if(hasErrors === false) {
    identity.login($username.val(), $password.val()).then((response) => {
      const { username } = Identity.decodeJWT(Cookies.get(`user-jwt`));

      // remove the login icon!
      $(`#ts-modal .modal-body`).html(`<small class="text-success">Welcome back, ${username}!</small>`)

      setTimeout(() => $(`#ts-modal`).modal(`hide`), 1000);

      clearUserActions();
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
  clearModalValidation();

  const $email = $(`#ts-email`);
  const $username = $(`#ts-username`);
  const $password = $(`#ts-password`);
  const $confirmPassword = $(`#ts-confirm-password`);

  let hasErrors = false;

  if(!$email[0].validity.valid) {
    hasErrors = true;

    addModalValidation($email, `danger`, $email[0].validationMessage);
  }

  if(!$username[0].validity.valid) {
    hasErrors = true;

    addModalValidation($username, `danger`, $username[0].validationMessage);
  }

  if(!$password[0].validity.valid) {
    hasErrors = true;

    addModalValidation($password, `danger`, $password[0].validationMessage);
  }

  if(!$confirmPassword[0].validity.valid || $confirmPassword.val() !== $password.val()) {
    hasErrors = true;

    addModalValidation($confirmPassword, `danger`, $confirmPassword[0].validationMessage || `Passwords don't match`);
  }

  if(hasErrors === false) {
    identity.signup($email.val(), $username.val(), $password.val()).then((response) => {
      const { username } = Identity.decodeJWT(Cookies.get(`user-jwt`));

      // remove the modal icon!
      $(`#ts-modal .modal-body`).html(`<small class="text-success">Welcome, ${username}!</small>`)

      setTimeout(() => $(`#ts-modal`).modal(`hide`), 1000);

      clearUserActions();
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
      <input type="text" class="form-control" id="ts-username" placeholder="Enter a username" pattern="[A-Za-z0-9]{8,20}" required>
      <div class="form-control-feedback"></div>
      <small class="form-text text-muted">Your username can be between 8-20 characters long, containing only letters and numbers.</small>
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

const addUserAction = (actions) => {
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

const clearUserActions = () => {
  $(`.ts-user-actions`).html(``);
}

// Model
const universalModal = `
    <div class="modal" id="ts-modal" tabindex="-1" role="dialog" aria-labelledby="modal-header" aria-hidden="true">
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

const populateModal = (header, body, footer) => {
  $(`#ts-modal .modal-title`).html(header);
  $(`#ts-modal .modal-body`).html(body);
  $(`#ts-modal .modal-footer`).html(footer);
}

const addModalValidation = ($selector, validationStyle, validationText) => {
  $selector.parent().addClass(`has-${validationStyle}`);
  $selector.addClass(`form-control-${validationStyle}`)
  $selector.next().html(validationText);
}

const clearModalValidation = () => {
  $(`.form-group`).removeClass(`has-danger has-success has-warning`);
  $(`.form-control-feedback`).html(``);
}

$(`.icon-nav`).on(`click`, `div.ts-open-actions`, () => {
  $(`.ts-user-actions`).toggleClass(`open`)
});

let identity = new Identity();
