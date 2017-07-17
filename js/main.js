'use strict';

/*
 * IDEA: Instead of saving entire database each time, save the structure and the rows?
 * IDEA: Load two seperate databases, barebones, and the full one?
 */

class testSQL {
  constructor(options = {}) {
    this.db = new SQL.Database(options.buffer);
    console.log('object constructor set');
  }

  static load() {
    return new Promise((resolve, reject) => {
      let cachedDatabase = localStorage.getItem('testSQL');

      // Populate with stored database (cached/file) or use the default one
      if(cachedDatabase) {
        this.loadCached(cachedDatabase, resolve, reject);
      } else {
        testSQL.loadDefault(resolve, reject);
      }
    });
  }

  static loadDefault(resolve, reject) {
    let xhr = new XMLHttpRequest();

    // TODO Load default database if can't find session (send back default string)
    // TODO fetch the filename from PHP!
    xhr.open(`GET`, `Chinook_Sqlite.db`);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      if (xhr.status === 200) {
        console.log('Loaded from default.');
        resolve(new Uint8Array(xhr.response));
      } else {
        reject(Error('Bad, Bad'));
      }
    };

    xhr.send();
  }

  static loadCached(cachedDatabase, resolve, reject) {
    let result = [];
    let i;
    let size;

    for (i = 0, size = cachedDatabase.length; i < size; i += 1) {
      result.push(cachedDatabase.charCodeAt(i));
    }

    resolve(new Uint8Array(result));
  }

  save() {
    let result = this.db.export();
    let strings = [];
    let i;
    let chunksize = 0xffff;

    for (i = 0; i * chunksize < result.length; i = i + 1) {
      strings.push(String.fromCharCode.apply(null, result.subarray(i * chunksize, (i + 1) * chunksize)));
    }
    window.localStorage.setItem('testSQL', strings.join(''));
    console.log('saved to cache');
  }

  static loadUint8Array(uint8, resolve, reject) {
    // save the old database if the imported file is corrupt
    const _ts = ts;

    ts = new testSQL({ buffer: uint8 });

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

  executeInput(sql, save) {
    try {
      showOutput(this.db.exec(sql));

      let rowsModified = this.db.getRowsModified();
      // denotes a DELETE, UPDATE, INSERT operation
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

  displaySchema() {
    // TODO: Could cache this?
    let schema = this.db.exec(`SELECT "tbl_name" FROM "sqlite_master" WHERE "type" = 'table' AND "tbl_name" != "ts-questions"`);
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

testSQL.load().then((response) => {
  // load after the database
  ts = new testSQL({ buffer: response });

  ts.displaySchema();
},
(error) => {
  console.log(error);
});

const showOutput = function showOutput(result) {
  console.log(result);
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

const showResponse = (msg, alertType) => {
  $('#ts-responses').append(`<div class="alert alert-${alertType || `danger`} mt-1 mb-0 alert-dismissible fade show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>${msg}</div>`);
}

const clearView = (andInput) => {
  $('#ts-responses > div').remove();
  $('#ts-result').html(`<span class="text-muted">Click "Run SQL" to execute the SQL statement above.</span>`);

  if(andInput) {
    input.setValue('');
  }
}

const clearAllLocalStorage = () => {
  localStorage.clear();
  clearCookies();
}

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
  $(`.ts-restore-icon`).on(`click`, function() {
    testSQL.load().then((response) => {
      clearAllLocalStorage();

      // load after the database
      ts = new testSQL({ buffer: response });

      ts.displaySchema();
      // TODO: Questions
    },

    function (error) {
      console.log(error);
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
