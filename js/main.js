'use strict';

/*
 * IDEA: Instead of saving entire database each time, save the structure and the rows?
 * IDEA: Load two seperate databases, barebones, and the full one?
 */

class testSQL {
  constructor(options = {}) {
    this.db = new SQL.Database(options.buffer);
    this.q = new Question(this.db);
    this.execute('CREATE TABLE IF NOT EXISTS `ts-questions` (`ts-number` INTEGER PRIMARY KEY, `ts-question` TEXT, `ts-answer` TEXT, `ts-keywords` TEXT, `ts-completed` NULL DEFAULT NULL)');
    console.log('object constructor set');
  }

  static load() {
    return new Promise((resolve, reject) => {
      let cachedDatabase = localStorage.getItem('testSQL');
      let sessionKey = window.sessionStorage.getItem('sessionKey');

      // Populate with stored database (cached/file) or use the default one
      if (sessionKey) {
        this.loadFile(sessionKey, resolve, reject);
        console.log('From file');
      } else if (cachedDatabase) {
        this.loadCached(cachedDatabase, resolve, reject);
        console.log('Cached Loaded');
      } else {
        testSQL.loadDefault(resolve, reject);
      }
    });
  }

  // TODO Make php return file name of personalized database
  // TODO Make this one http request instead of two (return the buffer straight from PHP)
  static loadFile(sessionKey, resolve, reject) {
    $.ajax({
      method: 'post',
      url: 'request.php?action=load',
      data: { key: sessionKey },
      dataType: 'json',
      success: function(data) {
        let xhr = new XMLHttpRequest();

        // TODO Load default database if can't find session (send back default string)
        // TODO fetch the filename from PHP!
        xhr.open('GET', data.relativePath, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
          if (xhr.status === 200) {
            console.log('Loaded from default.');
            resolve(new Uint8Array(this.response));
          } else {
            reject(Error('Bad, Bad'));
          }
        };

        xhr.send();
      },

      error: function(data) {
        this.loadDefault();
      },
    });
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

  static loadDefault(resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'Chinook_Sqlite.db', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (xhr.status === 200) {
        console.log('Loaded from default.');
        resolve(new Uint8Array(this.response));
      } else {
        reject(Error('Bad, Bad'));
      }
    };

    xhr.send();
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

  execute(sql, hideErrors) {
    try {
      return this.db.exec(sql);
    } catch (e) {
      console.log(e);
    }
  }

  validateAnswer(sql) {
    // Remove old alerts
    cleanView();

    // Get the question, based on the current question (COOKIE)
    let questionNumber = Cookies.get('CurrentQuestion');
    let questionInfo = this.Questions().get(questionNumber);
    console.log(questionInfo);
    if (questionInfo) {
      /*
       * Step 1:  Constraint checking
       */
      let inputSQL = sql.toUpperCase();
      let modelSQL = questionInfo[0].values[0][2];
      let modelConstraints = questionInfo[0].values[0][3];
      if (modelConstraints) {
        let constraintsArray = modelConstraints.split(',');
        let violations = constraintsArray.filter(el => inputSQL.indexOf(el) === -1);

        // Check if any constraints were violated
        if (violations.length > 0) {
          return showResponse(`Looking for the incursion of the keyword: ${violations[0]} but not found`);
        }
      }

      let response;
      // What type of statement is the question expecting
      if (questionInfo[0].values[0][5] == 'INSERT') {
        response = this.validateInsertAnswer(questionInfo, inputSQL);
      } else {
        response = this.validateSelectAnswer(questionInfo, inputSQL);
      }

      if(response === true) {
        let isCompleted = questionInfo[0].values[0][4];
        if (!isCompleted) {
          this.Questions().markCompleted(questionNumber);
          this.save();
          console.log('MARKED');
        }

        return showResponse(`Well done! The question was solved`, `success`);
      }

      return response;
    }
    return showResponse(`An error occurred while fetching the question`);
  }

  validateSelectAnswer(questionInfo, inputSQL) {
    let modelSQL = questionInfo[0].values[0][2];
    /*
     * Construct object of objects of each statement
     */
    const modelStmt = this.db.prepare(modelSQL);
    const modelResultObj = [];
    while (modelStmt.step()) modelResultObj.push(modelStmt.getAsObject());
    modelStmt.free();

    const inputStmt = this.db.prepare(inputSQL);
    const inputResultObj = [];
    while (inputStmt.step()) inputResultObj.push(inputStmt.getAsObject());
    inputStmt.free();

    /*
     * Step 2:  Preliminary checks
     *          Checks for simularity regarding size of rows and selected columns
     */
    // TODO input can return no results and will pass the checks
    if (modelResultObj.length !== inputResultObj.length || !inputResultObj.length) {
      return showResponse(`Expected a total of ${modelResultObj.length} row(s), instead recieved ${inputResultObj.length}`);
    }

    // Get the columns
    const inputCols = Object.keys(inputResultObj[0]);
    const modelCols = Object.keys(modelResultObj[0]);

    if (inputCols.length !== modelCols.length) {
      return showResponse(`Expected only the following column(s) to be selected: ${modelCols.join(', ')}`);
    }

    /*
     * Step 3:  Check each row individually for simularity
     */
    function normalize(colName) {
      return colName.replace(/[^A-Z()*]+/gi, '');
    }

    for (let i = 0; i < inputCols.length; i = i + 1) {
      // Create an object containing the current looped column's rows
      // .forEach() ~50% speed increase on .map()
      const modelRowObj = [];
      modelResultObj.forEach(el => modelRowObj.push(el[normalize(inputCols[i])]));

      const inputRowObj = [];
      inputResultObj.forEach(el => inputRowObj.push(el[normalize(inputCols[i])]));

      if (modelRowObj.length !== inputRowObj.length) {
        return showResponse(`Expected only the following columns to be selected: ${modelCols.join(', ')}`);
      }

      let lastRow;
      const isEqual = modelRowObj.every((item, idx) => {
        lastRow = item;
        return inputRowObj.indexOf(item) !== -1;
      });

      if (!isEqual) {
        return showResponse(`The row containing "${lastRow}" in the column ${inputCols[i]} wasn't found`);
      }
    }

    return true;
  }

  Questions() {
    return this.q;
  }
}

function showResponse(msg, alertType) {
  $('#ts-responses').append('<div class="alert alert-' + (alertType || 'danger') + ' mb-1 alert-dismissible fade show"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + msg + '</div>');
}

function cleanView() {
  $('#ts-responses > div').remove();
}
