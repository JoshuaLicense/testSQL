'use strict';

class Question {
  constructor() {
    this.initialize();
  }

  initialize() {
    ts.db.exec('CREATE TABLE IF NOT EXISTS `ts-questions` (`ts-number` INTEGER PRIMARY KEY, `ts-theme` TEXT, `ts-question` TEXT, `ts-answer` TEXT, `ts-keywords` TEXT, `ts-statement` TEXT, `ts-completed` NULL DEFAULT NULL)');

    if(this.total() === 0) {
      throw Error(`No questions found`);
    }

    // Override the main execute class to validate the answer too!
    const _executeInput = ts.executeInput;
    ts.executeInput = (sql) => {
      _executeInput.call(ts, sql, this.validateInput(sql));
    }

    const _importFile = ts.importFile;
    ts.importFile = (file) => {
      _importFile(file).then(() => {
        this.refresh();
      },
      (error) => {
        console.log(error);
      });
    }
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

  total() {
    return questionFunctions.length;
  }

  // No need to save to file as file is saved to cache immediately on login
  get(number) {
    const storedQuestion = ts.db.exec('SELECT * FROM `ts-questions` WHERE `ts-number` = ' + number);

    if (storedQuestion.length > 0) {
      const [ number, theme, question, answer, keywords, statement, completed, ] = storedQuestion[0].values[0];

      return {
        number,
        theme,
        question,
        answer,
        keywords,
        completed,
        statement,
      };
    }

    let findQuestion = findQuestionInArray(number);
    let newQuestion = findQuestion.func();

    const questionObj = {
      theme : findQuestion.theme,
      question : newQuestion.question,
      number : number,
      answer : newQuestion.answer,
      keywords : newQuestion.keywords || [],
      statement : newQuestion.statement || `SELECT`,
    };

    this.save(questionObj);

    const { theme, question } = questionObj;

    return { number, theme, question, completed : false }
  }

  save({ theme, question, number, answer, keywords, statement, }) {
    let stmt = ts.db.prepare(`INSERT INTO \`ts-questions\` VALUES (?, ?, ?, ?, ?, ?, NULL)`, [number, theme, question, answer, keywords, statement]);
    stmt.step();
    stmt.free();

    ts.save();
    // TODO: If logged in, save to their file
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
      let Number = questionInfo.number;
      let Theme = questionInfo.theme;
      let Text = questionInfo.question;
      let isCompleted = questionInfo.completed;

      html = html + `<button type="button" class="btn ${currentQuestion === Number ? 'active' : ''} ${isCompleted ? 'btn-success' : 'btn-secondary'}" id="ts-q${Number}" data-number="${Number}" data-text="${Text}" data-theme="${Theme}" data-isCompleted="${isCompleted}" tabindex="${Number}">${Number}</button>`;
    }

    $(`#ts-question-numbers`).html(html);
  }

  display(questionNumber) {
    let questionInfo = $(`#ts-q${questionNumber}`).data();
    if(typeof questionInfo.number !== `undefined`) {
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
    this.initialize();

    this.displayNumbers();

    this.display(1);
  }

  validateInput(inputSQL) {
    // Get the question, based on the current question (COOKIE)
    let questionNumber = Cookies.get(`CurrentQuestion`);
    const { number, theme, question, answer, keywords, statement, isCompleted, } = this.get(questionNumber);
    console.log(isCompleted);
    /*
     * Step 1:  Constraint checking
     */
    let capitalizedInput = inputSQL.toUpperCase();
    if (keywords.length > 0) {
      let violations = keywords.filter(el => capitalizedInputSQL.indexOf(el) === -1);

      // Check if any constraints were violated
      if (violations.length > 0) {
        showResponse(`Looking for the incursion of the keyword: ${violations[0]} but not found`);
        return false;
      }
    }

    // Don't allow mismatch of statements
    if(answer.indexOf(statement) === -1) {
      showResponse(`Expecting a ${statement} statement`)
      return false;
    }

    let response;
    // What type of statement is the question expecting
    if(statement === 'SELECT') {
      response = this.validateSelect(answer, inputSQL);
    } else {
      response = this.validateInsert(answer, inputSQL);
    }

    if(response === true) {
      if (!completed) {
        this.markCompleted(questionNumber);
        console.log('MARKED');
        return true;
      }

      showResponse(`Well done! The question was solved`, `success`);
      return false;
    }
    return false;
  }

  validateSelect(answerSQL, inputSQL) {
    /*
     * Construct object of objects of each statement
     */
    // TODO: Optimize, can exec then loop?
    const modelStmt = ts.db.prepare(answerSQL);
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
    const normalize = (colName) => {
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
});
