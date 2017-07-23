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

    xhr.open(`GET`, `../src/routing.php?action=loadDefault`);
    xhr.responseType = `arraybuffer`;

    xhr.onload = function(e) {
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
  loadUint8Array(uint8, resolve, reject) {
    // save the old database if the imported file is corrupt
    const _ts = ts;

    ts = new testSQL(uint8);

    // the scheme will fail to load if the file is not a VALID database
    try {
      ts.displaySchema();
      ts.save();

      clearAllLocalStorage();

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
        this.loadUint8Array(uint8, resolve, reject);
      }
      fileReader.readAsArrayBuffer(file);
    });
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
  ts = new testSQL({ buffer: response });

  ts.displaySchema();
}, (error) => {
  console.log(error);
});

/**
 * Displays the result of the user input in tables
 * @param {array} result  - the result of the query
 */
const showOutput = (result) => {
  let html;

  if(result.length > 0) {
    html = `<div class="mb-2">Number of returned records: ${result[0].values.length}</div>`;
    html = html + `<div class="table-responsive">`;
    html = html + `<table class="table table-striped table-sm table-bordered">`;

    result[0].columns.forEach((el) => html = html + `<th>${el}</th>`);

    result[0].values.forEach((el) => {
      html = html + `<tr>`;
      el.forEach((el) => html = html + `<td>${el}</td>`);
      html = html + `</tr>`;
    });
    html = html + `</div>`;
    html = html + `</table>`;
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
  localStorage.clear();
  clearCookies();
}

/**
 * Clears the applications cookies
 */
const clearCookies = () => {
  Object.keys(Cookies.get()).forEach((cookieName) => Cookies.remove(cookieName));
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

  /* Restore icon */
  $(`.ts-restore-icon`).on(`click`, () => {
    testSQL.load().then((response) => {
      clearAllLocalStorage();

      // load after the database
      ts = new testSQL({ buffer: response });

      ts.displaySchema();
    });
  });

  /* Import icon */
  $(`#ts-import`).on(`change`, function() {
    let file = $(this).get(0).files[0];

    ts.importFile(file);
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


  /* Database schema tables */
  $(`.ts-schema`).on(`click`, `li`, function() {
    let tableName = $(this).data(`name`);
    let sql = `SELECT * FROM \`${tableName}\``;

    input.setValue(sql);
    showOutput(ts.db.exec(sql));
  });
});
