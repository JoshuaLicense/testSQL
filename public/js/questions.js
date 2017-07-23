'use strict';

/** Class representing the question generation */
class Question {
  /**
   * Initializes the questions
   */
  constructor() {
    this.initialize();
  }

  /**
   * Initialized the questions, overrides main.js functions
   */
  initialize() {
    ts.db.exec(`CREATE TABLE IF NOT EXISTS \`ts-questions\` (\`ts-number\` INTEGER PRIMARY KEY, \`ts-theme\` TEXT, \`ts-question\` TEXT, \`ts-answer\` TEXT, \`ts-keywords\` TEXT, \`ts-statement\` TEXT, \`ts-completed\` NULL DEFAULT NULL)`);

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
        ts.save();
      },
      (error) => {
        console.log(error);
      });
    }
  }

  /**
   * Removes question(s) from the cache
   * @param {integer} number - the question number
   */
  removeCachedQuestion(number) {
    let sql = `DELETE FROM \`ts-questions\``;

    if(number) {
      sql = `${sql} WHERE \`ts-number\` = ${number}`;
    }

    ts.db.exec(sql);
  }

  /**
   * Returns the total questions in the question.functions.js object
   */
  total() {
    return questionFunctions.length;
  }

  /**
   * Get a particular question object if exists, else generate one
   * @param {integer} number - the question number
   *
   * @return {object} object containing information regarding the question
   */
  get(number) {
    const storedQuestion = ts.db.exec(`SELECT * FROM \`ts-questions\` WHERE \`ts-number\` = ${number}`);

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

    const findQuestion = findQuestionInArray(number);
    const newQuestion = findQuestion.func();

    const questionObject = {
      theme : findQuestion.theme,
      question : newQuestion.question,
      number : number,
      answer : newQuestion.answer,
      keywords : newQuestion.keywords || [],
      statement : newQuestion.statement || `SELECT`,
    };

    this.save(questionObject);

    const { theme, question } = questionObj;

    return { number, theme, question, completed : false }
  }

  /**
   * Saves the question information in the database
   * @param {string} theme - the question theme
   * @param {string} question - the question text
   * @param {string} number - the question number
   * @param {string} answer - the model SQL query
   * @param {array}  keywords - the array of keywords that are expected in the solution
   * @param {string} statement - the type of statement expected (SELECT, UPDATE)
   */
  save({ theme, question, number, answer, keywords, statement, }) {
    const stmt = ts.db.prepare(`INSERT INTO \`ts-questions\` VALUES (?, ?, ?, ?, ?, ?, NULL)`, [number, theme, question, answer, keywords, statement]);
    stmt.step();
    stmt.free();
  }

  /**
   * Checks if the question is marked as completed or not
   * @param {integer} number - the question number
   *
   * @return {boolean} boolean of if the question is completed or not
   */
  isCompleted(number) {
    let isCompleted = ts.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL ' + (number ? "AND `ts-number` = " + number : ""));

    return !!isCompleted;
  }

  /**
   * Gets all the completed question numbers
   * @return {array} the completed question numbers
   */
  getAllCompleted() {
    let completed = ts.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL');

    return completed[0].values.reduce((a, b) => a.concat(b));
  }

  /**
   * Mark a question completed and move onto the next unanswered question
   * @param {integer} number - the question number
   */
  markCompleted(number) {
    ts.db.exec('UPDATE `ts-questions` SET `ts-completed` = 1 WHERE `ts-number` = ' + number);

    $(`#ts-q${number}`).removeClass(`btn-secondary`).addClass(`btn-success`);

    // next unanswered question (if exists)
    this.display($('#ts-question-numbers > button:not(.btn-success):first').data(`number`));
  }

  /**
   * Display the question numbers
   */
  displayNumbers() {
    let html = '';
    let total = this.total();

    for(let i = 0; i < total; i = i + 1) {
      let questionInfo = this.get(i + 1);
      let Number = questionInfo.number;
      let Theme = questionInfo.theme;
      let Text = questionInfo.question;
      let isCompleted = questionInfo.completed;

      html = html + `<button type="button" class="btn ${currentQuestion === Number ? 'active' : ''} ${isCompleted ? 'btn-success' : 'btn-dark'}" id="ts-q${Number}" data-number="${Number}" data-text="${Text}" data-theme="${Theme}" data-isCompleted="${isCompleted}" tabindex="${Number}">${Number}</button>`;
    }

    $(`#ts-question-numbers`).html(html);
  }

  /**
   * Display the question text and theme
   */
  display(number) {
    let questionInfo = $(`#ts-q${number}`).data();
    if(typeof questionInfo !== `undefined`) {
      Cookies.set(`CurrentQuestion`, number);
      currentQuestion = number;

      // remove the .active class and assign to new question
      $('#ts-question-numbers > button.active').removeClass('active');
      $(`#ts-q${number}`).addClass('active');

      let cardHeader = questionInfo.iscompleted ? `<div class="float-right"><i class="fa fa-check" aria-hidden="true" style="color: #5cb85c;"></i></div>` : ``;
      cardHeader = cardHeader + questionInfo.theme;
      $(`#ts-questions .card-header`).html(cardHeader);
      $(`#ts-questions .card-text`).html(questionInfo.text);
    }
  }

  /**
   * Generates a new set of questions
   */
  refresh() {
    this.initialize();

    this.displayNumbers();

    this.display(1);
  }

  /**
   * Validate a user-inputted solution
   * @param {string} inputSQL - the input to be validated
   *
   * @return {boolean} returns true if a correct unanswered solution was found
   */
  validateInput(inputSQL) {
    const questionNumber = Cookies.get(`CurrentQuestion`);
    const { number, theme, question, answer, keywords, statement, completed, } = this.get(questionNumber);
    const capitalizedInput = inputSQL.toUpperCase();

    // Step 1:  Constraint checking
    if (keywords.length > 0) {
      const violations = keywords.filter(el => capitalizedInputSQL.indexOf(el) === -1);
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
    // delegate to appropriate validation method
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

  /**
   * Validates a SELECT statement
   * @param {string} inputSQL - the input to be validated
   * @param {string} answerSQL - the model answer
   *
   * @return {boolean} returns true if a correct solution
   */
  validateSelect(answerSQL, inputSQL) {
    // Construct object of objects of each statement
    const modelStmt = ts.db.prepare(answerSQL);
    const modelResultObj = [];
    while (modelStmt.step()) modelResultObj.push(modelStmt.getAsObject());
    modelStmt.free();

    const inputStmt = ts.db.prepare(inputSQL);
    const inputResultObj = [];
    while (inputStmt.step()) inputResultObj.push(inputStmt.getAsObject());
    inputStmt.free();

    // Step 2:  Preliminary checks
    // Checks for simularity regarding size of rows and selected columns
    // TODO input can return no results and will pass the checks
    if (modelResultObj.length !== inputResultObj.length || !inputResultObj.length) {
      showResponse(`Expected a total of ${modelResultObj.length} row(s), instead recieved ${inputResultObj.length}`);
      return false;
    }

    // Get the columns
    const inputCols = Object.keys(inputResultObj[0]);
    const modelCols = Object.keys(modelResultObj[0]);

    if (inputCols.length !== modelCols.length) {
      showResponse(`Expected only the following column(s) to be selected: ${modelCols.join(', ')}`);
      return false;
    }

    /**
     * Normalize the column name (remove everything but A-Z, brackets, and *)
     * @param {string} input - the string to be normalized
     *
     * @return {string} returns the normalized string
     */
    const normalize = (input) => {
      return colName.replace(/[^A-Z()*]+/gi, '');
    }

    // Step 3:  Check each row individually for simularity
    for (let i = 0; i < inputCols.length; i = i + 1) {
      // Create an object containing the current looped column's rows
      // .forEach() ~50% speed increase on .map()
      const modelRowObj = [];
      modelResultObj.forEach(el => modelRowObj.push(el[normalize(inputCols[i])]));

      const inputRowObj = [];
      inputResultObj.forEach(el => inputRowObj.push(el[normalize(inputCols[i])]));

      if (modelRowObj.length !== inputRowObj.length) {
        showResponse(`Expected only the following columns to be selected: ${modelCols.join(', ')}`);
        return false;
      }

      let lastRow;
      const isEqual = modelRowObj.every((item, idx) => {
        lastRow = item;
        return inputRowObj.indexOf(item) !== -1;
      });

      if (!isEqual) {
        showResponse(`The row containing "${lastRow}" in the column ${inputCols[i]} wasn't found`);
        return false;
      }
    }

    return true;
  }
}

let currentQuestion = parseInt(Cookies.get(`CurrentQuestion`)) || 1;
let question;

// run after the main promise is resolved
testSQLPromise.then(() => {
  question = new Question();

  const questionNumbersHTML = `
  <div class="row"><div class="col">
    <div class="btn-group btn-group-sm mb-1" id="ts-question-numbers" role="group" aria-label="Questions"> </div>
    <div class="card" id="ts-questions">
      <h6 class="card-header"></h6>
      <div class="card-block">
        <p class="card-text ts-loading">Loading questions<span>.</span><span>.</span><span>.</span></p>
      </div>
    </div>
  </div>`;

  $(`main`).prepend(questionNumbersHTML);

  question.displayNumbers();

  $(`#ts-question-numbers button`).on(`click`, function() {
    let newQuestion = $(this).data(`number`);

    if(currentQuestion === newQuestion) {
      return;
    }

    currentQuestion = question.display(newQuestion) || currentQuestion;
  });

  // load the current question
  question.display(currentQuestion);
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
