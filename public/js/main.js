'use strict';

/*
 * IDEA: Instead of saving entire database each time, save the structure and the rows?
 * IDEA: Load two seperate databases, barebones, and the full one?
 */

/** Class representing the core application */
class testSQL {
  /**
   * Loads the relevant database and creates a database instance
   * @param {object} arrayBuffer - the database as an array buffer
   */
  constructor(arrayBuffer) {
    this.db = new SQL.Database(arrayBuffer);

    const databaseActionsContainer = `
      <div class="ts-expandable-icon-container" style="order: 2;">
        <div class="icon ts-expandable-icon" role="button">
          <i class="fa fa-database"></i>
          <h6>Database</h6>
        </div>
        <div class="ts-expandable-area-container">
          <div class="d-flex ts-expandable-area ts-database-actions"> </div>
        </div>
      </div>`;

    // only add it if not already in the DOM, if so clear the actions to reconstruct!
    $(`.ts-database-actions`).length === 0 && $(`.icon-nav`).prepend(databaseActionsContainer);

    addExpandableActions(
      `ts-database-actions`,
      [ databaseActions.import, databaseActions.restore, databaseActions.download, ]
    );
  }

  /**
   * Load a relevant database
   * @return {object} - returns a promise object
   */
  static load() {
    return new Promise((resolve, reject) => {
      let cachedDatabase = localStorage.getItem('testSQL');

      // Delegate to most suitable function
      if(cachedDatabase) {
        this.loadCached(cachedDatabase, resolve, reject);
      } else {
        this.loadDefault(resolve, reject);
      }
    });
  }

  /**
   * Load the default database
   * @param {object} resolve  - the resolve promise object
   * @param {object} reject   - the reject promise object
   *
   * @return {object}         - returns a promise object
   */
  static loadDefault(resolve, reject) {
    let xhr = new XMLHttpRequest();

    xhr.open(`GET`, `../resources/default.database.sqlite`);
    xhr.responseType = `arraybuffer`;

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(new Uint8Array(xhr.response));
      } else {
        reject();
      }
    };

    xhr.send();
  }

  /**
   * Converts a database file (sqlite) into a Uint8Array
   * @param {string} cachedDatabase - the raw database file
   * @param {object} resolve        - the resolve promise object
   * @param {object} reject         - the reject promise object
   *
   * @return {object}               - returns a promise object
   */
  static loadCached(cachedDatabase, resolve, reject) {
    const result = [];
    let i;
    let size;

    for (i = 0, size = cachedDatabase.length; i < size; i += 1) {
      result.push(cachedDatabase.charCodeAt(i));
    }

    resolve(new Uint8Array(result));
  }

  /**
   * Converts a Uint8Array to a database file string and saves it in the local storage
   */
  save() {
    const result = this.db.export();
    const strings = [];
    const chunksize = 0xffff;
    let i;

    for (i = 0; i * chunksize < result.length; i = i + 1) {
      strings.push(String.fromCharCode.apply(null, result.subarray(i * chunksize, (i + 1) * chunksize)));
    }

    window.localStorage.setItem('testSQL', strings.join(''));
  }

  /**
   * Converts a database file (sqlite) into a Uint8Array
   * @param {array} uint8           - the Uint8Array
   * @param {object} resolve        - the resolve promise object
   * @param {object} reject         - the reject promise object
   *
   * @return {object}               - returns a promise object
   */
  static loadUint8Array(uint8, resolve, reject) {
    // save the old database if the imported file is corrupt
    const _ts = ts;

    ts = new testSQL(uint8);

    // the scheme will fail to load if the file is not a VALID database
    try {
      ts.displaySchema();
      ts.save();

      resolve();
    } catch(e) {
      // revert all changes
      ts = _ts;
      reject(Error('Bad, Bad'));
    }
  }

  /**
   * Imports a database from a local file
   * @param {object} file           - the file object
   *
   * @return {object}               - returns a promise object
   */
  importFile(file) {
    return new Promise((resolve, reject) => {
      let fileReader = new FileReader();
      fileReader.onload = () => {
        const uint8 = new Uint8Array(fileReader.result);
        testSQL.loadUint8Array(uint8, resolve, reject);
      }
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Downloads the current database
   */
  download() {
    const blob = new Blob([ts.db.export()], {type: `application/x-sqlite-3`});

    var a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = 'testSQL.sqlite';
    a.onclick = () => {
      setTimeout(() => {
        window.URL.revokeObjectURL(a.href);
      }, 1500);
    }
    a.click();
  }

  /**
   * Execute the current textarea input
   * @param {string}  sql         - the raw database file
   * @param {boolean} save        - should the database be saved locally
   */
  executeInput(sql, save = false) {
    try {
      showOutput(this.db.exec(sql));

      let rowsModified = this.db.getRowsModified();

      // indicates a DELETE, UPDATE, INSERT operation
      if(rowsModified > 0) {
        this.displaySchema();
      }

      // only save the database if rows have been modified or questions.js indicates to
      if(rowsModified > 0 || save) {
        this.save();
      }

    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Display the current schema in the DOM
   */
  displaySchema() {
    const schema = this.db.exec(`SELECT "tbl_name" FROM "sqlite_master" WHERE "type" = 'table' AND "tbl_name" != "ts-questions"`);
    let html = ``;

    schema[0].values.forEach((el) => {
      let count = this.db.exec(`SELECT COUNT(*) FROM ${el}`);

      html = html + `<li class="list-group-item list-group-item-action justify-content-between py-1" data-name="${el}" role="button">${el} <span class="badge badge-default badge-pill">${count[0].values[0]}</span></a>`
    });

    $(`.ts-schema`).html(html);
  }
}

/* load (async) the required data before instanticing the class
 * http://stackoverflow.com/questions/24398699/is-it-bad-practice-to-have-a-constructor-function-return-a-promise
 */
let ts;

let testSQLPromise = testSQL.load().then((response) => {
  // load after the database
  ts = new testSQL(response);

  ts.displaySchema();
}, (error) => {
  console.log(error);
});

/**
 * Displays the result of the user input in tables
 * @param {array} result  - the result of the query
 */
const showOutput = (result) => {
  let html = ``;
  const maximumRowsToDisplay = 5;

  if(result.length > 0) {
    html = html + `<div class="table-responsive">`;
    html = html + `<table class="table table-hover">
      <thead class="thead-inverse">`;
    result[0].columns.forEach((el) => html = html + `<th>${el}</th>`);
    html = html + `</thead>`;

    result[0].values.slice(0, maximumRowsToDisplay).forEach((el) => {
      html = html + `<tr>`;
      el.forEach((el) => html = html + `<td>${el}</td>`);
      html = html + `</tr>`;
    });

    if(result[0].values.length > maximumRowsToDisplay) {
      html = html + `<tr> <td class="text-muted small" colspan="${result[0].columns.length}"> and ${(result[0].values.length - maximumRowsToDisplay)} more results </td> </tr>`;
    }

    html = html + `</table>`;
    html = html + `</div>`;
  } else {
      showResponse(`${ts.db.getRowsModified()} rows affected`, `success`);
  }

  $('#ts-result').html(html);
}

/**
 * Execute the current textarea input
 * @param {string}  message         - the message to display inside the alert box
 * @param {string}  alertType       - the class allocated to the alert box (danger, success, warning)
 */
const showResponse = (message, alertType) => {
  $('#ts-responses').append(`<div class="alert alert-${alertType || `danger`} mt-1 mb-0 alert-dismissible fade show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>${message}</div>`);
}

/**
 * Execute the current textarea input
 * @param {boolean}  andInput       - clear the textarea input value too?
 */
const clearView = (andInput) => {
  $('#ts-responses > div').remove();
  $('#ts-result').html(`<span class="text-muted">Click "Run SQL" to execute the SQL statement above.</span>`);

  if(andInput) {
    input.setValue('');
  }
}

/**
 * Clears the applications cookies and the local storage
 */
const clearAllLocalStorage = () => {
  clearLocalStorage();
  clearCookies();
}

/**
 * Clears the applications cookies
 */
const clearCookies = () => {
  Object.keys(Cookies.get()).forEach((cookieName) => Cookies.remove(cookieName));
}

/**
 * Clears the local storage
 */
const clearLocalStorage = () => {
  localStorage.clear();
}

/**
 * Adds action icons to an expandable sidebar icon
 * @param {string}  expandableClass  - the class to add the actions too
 * @param {array}   actions         - the array of objects containing icon information
 * @param {bool}    append          - should the icons be appended to the class?
 */
const addExpandableActions = (expandableClass, actions, append = false) => {
  let html = ``;

  for(const {className, fileUploadID, icon, heading, onClick} of actions) {
    // don't add the icon to the DOM if it exists
    if($(`.${className}`).length !== 0) return;

    html += `
      <div class="icon ${className}" ${onClick ? `role="button"` : ``}>`;

    if(fileUploadID) {
      html += `
        <label for="${fileUploadID}" class="m-0" style="cursor: inherit;">
          <input type="file" id="ts-import" style="display:none" />`;
    }

    html += `
        <i class="fa ${icon}" aria-hidden="true"></i>
        <h6>${heading}</h6>`;

    if(fileUploadID) {
      html += `</label>`;
    }

    html += `</div>`;

    if(onClick) {
      $(`.${expandableClass}`).on(`click`, `.${className}`, onClick);
    }
  }

  (append === true)
    ? $(`.${expandableClass}`).append(html)
    : $(`.${expandableClass}`).html(html);
}

/**
 * Removes all the actions from the specified expandable sidebar icon
 */
const clearExpandableActions = (className) => {
  $(`.${className}`).html(``);
}

// Database actions object of objects
const databaseActions = {
  import : {
    className: `ts-import-icon`,
    fileUploadID: `ts-import`,
    icon: `fa-folder`,
    heading: `Import`,
  },
  restore : {
    className: `ts-restore-icon`,
    icon: `fa-refresh`,
    heading: `Restore`,
  },
  download : {
    className: `ts-download`,
    icon: `fa-download`,
    heading: `Download`,
  },
};

databaseActions.import.onClick = () => {
  $(`#ts-import`).off().on(`change`, function() {
    const file = $(this).get(0).files[0];

    ts.importFile(file);
  });
}

databaseActions.restore.onClick = () => {
  clearLocalStorage();

  testSQL.load().then((response) => {
    // save the old database if the imported file is corrupt
    const _ts = ts;

    ts = new testSQL(response);

    // the scheme will fail to load if the file is not a VALID database
    try {
      ts.displaySchema();
      ts.save();

      alert(`Database restored successfully!`);
    } catch(e) {
      // revert all changes
      ts = _ts;

      alert(`Unable to restore database!`);
    }
  });
}

databaseActions.download.onClick = () => {
  ts.download();
}

/* jQuery Event Handlers */
$(document).ready(function() {
  /* "Run SQL" button */
  $(`.ts-run`).click(() => {
    let sql = input.getValue();
    if (sql) {
      // Remove old alerts
      clearView();
      try {
        ts.executeInput(sql);
      } catch(e) {
        showResponse(e);
      }
    } else {
      showResponse(`Needs something in it`);
    }
  });

  /* "Clear" button */
  $(`.ts-clear`).click(() => {
    input.setValue(``);
  });

  /* Help icon */
  $(`.ts-help-icon`).on(`click`, function() {
    alert(`help`);
  });

  /* Sidebar */
  $(`.sidebar`).draggable({
    axis: `x`,
    handle : `.sidebar-toggler`,
    containment: `.sidebar-container`,
    addClasses: false,
    stop: (event, ui) => {
      // to maintain position on resize
      const toPercentage = ui.position.left / ui.helper.parent().width() * 100;

      // too small!
      if(toPercentage > 30) {
        ui.helper.css('left', 'calc(100% - 18.75rem)'); // minus width of container (closed)
      } else {
        ui.helper.css('left', toPercentage + '%');
      }
    },
    drag: (event, { position : { left : offsetLeft }}) => {
      if (offsetLeft < 130) {
        // spin text (the container is wide enough)
        $(`.sidebar h6`).removeClass(`vertical`);
      } else {
        $(`.sidebar h6`).addClass(`vertical`);
      }
    }
  });

  $(`.sidebar-toggler`).on(`dblclick`, () => {
    const [{ offsetLeft }] = $(`.sidebar`).draggable(`widget`);
    $(`.sidebar`).css('left', +(offsetLeft === 276) || 'calc(100% - 18.75rem)');

    if (offsetLeft === 276) {
      // spin text (the container is wide enough)
      $(`.sidebar h6`).removeClass(`vertical`);
    } else {
      $(`.sidebar h6`).addClass(`vertical`);
    }
  });


  // Database schema tables
  $(`.ts-schema`).on(`click`, `li`, function() {
    let tableName = $(this).data(`name`);
    let sql = `SELECT * FROM \`${tableName}\``;

    input.setValue(sql);
    showOutput(ts.db.exec(sql));
  });


  // Handles the click event, show/hide
  $(`.icon-nav`).on(`click`, `div.ts-expandable-icon`, function(e) {
    // get the expandable area
    const $expandable = $(this).next().children(`.ts-expandable-area`);

    // close the other expandables
    $(`.ts-expandable-area.open`).not($expandable).removeClass(`open`);
    // open/close this one
    $expandable.toggleClass(`open`);

    if($expandable.hasClass(`open`)) {
      // add backdrop to DOM if doesn't exist
      let $backdrop = $(`.icon-backdrop`).length === 0
                        ? $(`<div class="icon-backdrop fade"></div>`).appendTo(document.body)
                        : $(`.icon-backdrop`);

      // setTimeout to allow the fade transition to happen
      setTimeout(() => $(`.icon-backdrop`).addClass(`show`));
    } else {
      // or remove the backdrop from the DOM

      $(`.icon-backdrop`).removeClass(`show`);
      // 150ms delay = css transition duration
      setTimeout(() => $(`.icon-backdrop`).remove(), 150);
    }

    // stop bubbling, otherwise the body click is triggered
    e.stopImmediatePropagation();

    // click somewhere that's not the icon bar? Hide expandables
    $(`body`).on(`click`, (event) => {
      $expandable.removeClass(`open`);

      $(`.icon-backdrop`).remove();

      // remove the listener
      $(`body`).off(`click`);
    });
  });
});
