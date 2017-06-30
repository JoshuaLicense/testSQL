'use strict';

class Question {
  constructor(db) {
    this.db = db;
  }

  // No need to save to file as file is saved to cache immediately on login
  get(number) {
    let storedQuestion = this.db.exec('SELECT * FROM `ts-questions` WHERE `ts-number` = ' + number);

    if (storedQuestion.length > 0) {
      console.log('Stored');
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
    this.save({number: number, question: 'Test', answer: 'SELECT * FROM Customers', keywords: 'A,B'});
    return true;
  }

  save(options = {}) {
    this.db.exec('INSERT INTO `ts-questions` VALUES ("' + options.number + '", "' + options.question + '", "' + options.answer + '", "' + options.keywords + '", NULL)');
    // TODO: If logged in, save to their file
  }

  total() {
    let total;
    // TODO: If logged in use
    total = this.db.exec('SELECT COUNT(*) FROM `ts-questions`');
    // else just count the json
    // total = questionsJson.length;
    console.log(total[0].values[0][0]);
    return total[0].values[0][0];
  }

  isCompleted(number) {
    let isCompleted = this.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL ' + (number ? "AND `ts-number` = " + number : ""));

    return !!isCompleted;
  }

  getAllCompleted() {
    let completed = this.db.exec('SELECT `ts-number` FROM `ts-questions` WHERE `ts-completed` IS NOT NULL');

    return completed[0].values.reduce((a, b) => a.concat(b));
  }

  markCompleted(number) {
    this.db.exec('UPDATE `ts-questions` SET `ts-completed` = 1 WHERE `ts-number` = ' + number);
  }
}
