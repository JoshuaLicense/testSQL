'use strict';

class Question {
  constructor() {
    ts.db.exec('CREATE TABLE IF NOT EXISTS `ts-questions` (`ts-number` INTEGER PRIMARY KEY, `ts-theme` TEXT, `ts-question` TEXT, `ts-answer` TEXT, `ts-keywords` TEXT, `ts-completed` NULL DEFAULT NULL)');
    console.log(`created again`);
    this.totalQuestions();
  }

  // questions get cached after being generated
  getAllCached() {
    let storedQuestions = ts.db.exec(`SELECT * FROM \`ts-questions\``);

    console.log(storedQuestions);
  }

  // leave param empty to refresh all questions
  removeCachedQuestion(number) {
    let sql = `DELETE FROM \`ts-questions\``;

    if(number) {
      sql = `${sql} WHERE \`ts-number\` = ${number}`;
    }

    ts.db.exec(sql);
    console.log(`cached deleted`);
  }

  totalQuestions() {
    console.log(questionFunctions.length);
  }

  // No need to save to file as file is saved to cache immediately on login
  get(number) {
    let storedQuestion = ts.db.exec('SELECT * FROM `ts-questions` WHERE `ts-number` = ' + number);

    if (storedQuestion.length > 0) {
      console.log('Stored', storedQuestion);
      return storedQuestion;
    }

    let maxAttempts = 5; // The number of loops trying to create the question
    let attempts = 0;

    while(this.make(number) === false) {
      attempts = attempts + 1;
      if(attempts > maxAttempts) {
        console.log('breaked');
        return false;
      }
    }

    // TODO: Could remove this call but would mean less flexibility in the future
    return this.get(number);
  }

  make(number) {
    console.log('make QUESTION');
    //Return [];
    this.save({number: number, theme: 'Intoducing Blah de Blah', question: 'Test', answer: 'SELECT * FROM Customers', keywords: 'A,B'});
    return true;
  }

  save(options = {}) {
    ts.db.exec('INSERT INTO `ts-questions` VALUES ("' + options.number + '", "' + options.theme + '", "' + options.question + '", "' + options.answer + '", "' + options.keywords + '", NULL)');
    ts.save();
    // TODO: If logged in, save to their file
  }

  total() {
    let total;
    // TODO: If logged in use
    total = ts.db.exec('SELECT COUNT(*) FROM `ts-questions`');
    // else just count the json
    // total = questionsJson.length;
    console.log(total[0].values[0][0]);
    return total[0].values[0][0];
  }

  isCompleted(number) {
    let isCompleted = ts.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL ' + (number ? "AND `ts-number` = " + number : ""));

    return !!isCompleted;
  }

  getAllCompleted() {
    let completed = ts.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL');

    return completed[0].values.reduce((a, b) => a.concat(b));
  }

  markCompleted(number) {
    ts.db.exec('UPDATE `ts-questions` SET `ts-completed` = 1 WHERE `ts-number` = ' + number);
    console.log(`marking`, ts.db.getRowsModified());
    $(`#ts-q${number}`).removeClass(`btn-secondary`).addClass(`btn-success`);

    // next unanswered question (if exists)
    this.display($('#ts-question-numbers > button:not(.btn-success):first').data(`number`));
  }

  displayNumbers() {
    let html = '';
    let total = this.total();

    for(let i = 0; i < total; i = i + 1) {
      let questionInfo = this.get(i + 1);
      let questionNumber = questionInfo[0].values[0][0];
      let questionTheme = questionInfo[0].values[0][1];
      let questionText = questionInfo[0].values[0][2];
      let isCompleted = !!questionInfo[0].values[0][5];

      html = html + `<button type="button" class="btn ${currentQuestion === questionNumber ? 'active' : ''} ${isCompleted ? 'btn-success' : 'btn-secondary'}" id="ts-q${questionNumber}" data-number="${questionNumber}" data-text="${questionText}" data-theme="${questionTheme}" data-isCompleted="${isCompleted}" tabindex="${questionNumber}">${questionNumber}</button>`;
    }

    $(`#ts-question-numbers`).html(html);
    return total;
  }

  display(questionNumber) {
    let questionInfo = $(`#ts-q${questionNumber}`).data();
    if(questionInfo) {
      Cookies.set(`CurrentQuestion`, questionNumber);
      currentQuestion = questionNumber;

      // remove the .active class and assign to new question
      $('#ts-question-numbers > button.active').removeClass('active');
      $(`#ts-q${questionNumber}`).addClass('active');

      let cardHeader = questionInfo.iscompleted ? `<div class="float-right"><i class="fa fa-check" aria-hidden="true" style="color: #5cb85c;"></i></div>` : ``;
      cardHeader = cardHeader + `Question ${questionInfo.number} - ${questionInfo.theme}`;
      $(`#ts-questions .card-header`).html(cardHeader);
      $(`#ts-questions .card-text`).html(questionInfo.text);
    }
  }

  refresh() {
    // TODO: Load questions
    question = new Question();

    this.displayNumbers();

    this.display(1);
  }

  validateAnswer(sql) {
    // Get the question, based on the current question (COOKIE)
    let questionNumber = Cookies.get('CurrentQuestion');
    let questionInfo = this.get(questionNumber);
    console.log(questionInfo);
    if (questionInfo) {
      /*
       * Step 1:  Constraint checking
       */
      let inputSQL = sql.toUpperCase();
      let modelSQL = questionInfo[0].values[0][3];
      let modelConstraints = questionInfo[0].values[0][4];
      if (modelConstraints) {
        let constraintsArray = modelConstraints.split(',');
        let violations = constraintsArray.filter(el => inputSQL.indexOf(el) === -1);

        // Check if any constraints were violated
        if (violations.length > 0) {
          showResponse(`Looking for the incursion of the keyword: ${violations[0]} but not found`);
          return false;
        }
      }

      // Don't allow mismatch of statements
      let operationExpected = questionInfo[0].values[0][6] || 'SELECT';
      if(modelSQL.indexOf(operationExpected) === -1) {
        showResponse(`Expecting a ${questionInfo[0].values[0][6]} operation`)
        return false;
      }

      let response;
      // What type of statement is the question expecting
      if(questionInfo[0].values[0][6] === 'INSERT') {
        response = this.validateInsertAnswer(questionInfo, inputSQL);
      } else {
        response = this.validateSelectAnswer(questionInfo, inputSQL);
      }

      if(response === true) {
        let isCompleted = questionInfo[0].values[0][5];
        console.log(questionInfo);
        if (!isCompleted) {
          this.markCompleted(questionNumber);
          console.log('MARKED');
          return true;
        }

        showResponse(`Well done! The question was solved`, `success`);
        return false;
      }
    }
    showResponse(`An error occurred while fetching the question`);
    return false;
  }

  validateSelectAnswer(questionInfo, inputSQL) {
    let modelSQL = questionInfo[0].values[0][3];
    /*
     * Construct object of objects of each statement
     */
    // TODO: Optimize, can exec then loop?
    const modelStmt = ts.db.prepare(modelSQL);
    const modelResultObj = [];
    while (modelStmt.step()) modelResultObj.push(modelStmt.getAsObject());
    modelStmt.free();

    const inputStmt = ts.db.prepare(inputSQL);
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
    const normalize = function normalize(colName) {
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
}

let question;

let currentQuestion = parseInt(Cookies.get(`CurrentQuestion`)) || 1;

// create the questions.js html
let html = `
<div class="row"><div class="col">
  <div class="btn-group btn-group-sm mb-1" id="ts-question-numbers" role="group" aria-label="Questions"> </div>
  <div class="card" id="ts-questions">
    <h6 class="card-header"></h6>
    <div class="card-block">
      <p class="card-text ts-loading">Loading questions<span>.</span><span>.</span><span>.</span></p>
    </div>
  </div>
</div>`;

$(document).ready(function() {
  let question = new Question();

  // only load the rest if questions exist...
  if(question.total() > 0) {
    // Override the main execute class to validate the answer too!
    let _executeInput = ts.executeInput;
    ts.executeInput = function() {
      [].push.call(arguments, question.validateAnswer(arguments[0]));
      console.log(arguments);
      _executeInput.apply(this, arguments);
    }

    let _importFile = ts.importFile;
    ts.importFile = function() {
      _importFile.apply(this, arguments);
      question.refresh();
    }

    $(`main`).prepend(html);

    question.displayNumbers();

    // load the current question
    question.display(currentQuestion);

    $(`body`).on(`click`, `#ts-question-numbers button`, function() {
      let newQuestion = $(this).data(`number`);

      if(currentQuestion === newQuestion) {
        return;
      }

      currentQuestion = question.display(newQuestion) || currentQuestion;
    });

    // binding arrow keys for improved accessibility
    // e.which for cross-broswer compatability
    // http://api.jquery.com/event.which/
    // TODO: Move top part
    $(document).keydown(function(e) {
      // don't call if cursor inside textarea
      if ($(e.target).is('textarea')) {
        // both enter key and ctrl key
        if (e.which == 13 && e.ctrlKey) {
          // execute the sql
          ts.executeInput(editable.getValue());
        }
      } else {
        if (e.which == 37) { // left arrow
          // simulate a click of the previous question
          currentQuestion = question.display(currentQuestion - 1) || currentQuestion;
        } else if (e.which == 39) { // right arrow
          // simulate a click of the next question
          currentQuestion = question.display(currentQuestion + 1) || currentQuestion;
        }
      }
    });

  } else {
    console.log(`No questions were found!`);
  }
});
