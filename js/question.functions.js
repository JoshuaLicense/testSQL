/** Exception **/
const QuestionError = function (message) {
  this.message = message;
}

/** Styling functions **/

const empasize = (string) => {
  return `<em>${string}</em>`;
}

/** Dynamic question helper functions **/

/**
 * Find the question in the array of objects
 **/
const findQuestionInArray = (number) => {
  return questionFunctions.find((question) => {
    return question.number === parseInt(number);
  });
}

/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 **/
 const shuffle = (a) => {
     let j, x, i;
     for (i = a.length; i; i--) {
         j = Math.floor(Math.random() * i);
         x = a[i - 1];
         a[i - 1] = a[j];
         a[j] = x;
     }
     return a;
 }

/**
 * Getting a random integer between two values, inclusive
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 **/
 const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getXTables = (x) => {
  const getTables = ts.db.exec(`SELECT "tbl_name" FROM "sqlite_master" WHERE "type" = 'table' AND "tbl_name" != "ts-questions" ORDER BY RANDOM() LIMIT ${x}`);
  if(getTables[0].values.length > 0) {
    return getTables[0].values
  }

  throw new QuestionError(`No tables found in the database`);
}

const getSpecificColumns = (x, sameTable, dataType, isNullable) => {
  const getTables = getXTables(1000);
  const y = x || 1;
  const result = [];

  for(let i = 0; i < getTables.length && y > result.length; i = i + 1) {
    const getTableInfo = ts.db.exec(`PRAGMA table_info(${getTables[i]})`);
    const shuffledColumns = shuffle(getTableInfo[0].values);

    for(let j = 0; j < shuffledColumns.length && y > result.length; j = j + 1) {
      if(typeof isNullable !== `undefined`) {
        if(shuffledColumns[j][3] !== +isNullable) {
          //console.log(`matches null`);
          continue;
        }
      }

      if(typeof dataType !== `undefined`) {
        //console.log(`datatype: ${shuffledColumns[j][2].indexOf(dataType) === -1}`);
        if(shuffledColumns[j][2].indexOf(dataType) !== -1) {
          result.push({tbl : getTables[i], col : shuffledColumns[j]});
          continue;
        }
        continue;
      }
      result.push({tbl : getTables[i], col : shuffledColumns[j]})
    }

    if(typeof sameTable !== `undefined` && result.length < y) result.length = 0;
  }
  if(result.length > 0) {
    return result;
  }

  throw new QuestionError(`A suitable column with the parameters (x: ${x}, sameTable: ${sameTable}, dataType: ${dataType}, isNullable: ${isNullable})`);
}

const getForeignColumns = (x) => {
  const getTables = getXTables(1000);
  const y = x || 1;
  const result = [];

  for(let i = 0; i < getTables.length; i = i + 1) {
    const getForeignKeys = ts.db.exec(`PRAGMA foreign_key_list(${getTables[i]})`);

    if(getForeignKeys.length > 0) {
      console.log(getForeignKeys[0].values.length);
      if(getForeignKeys[0].values.length < y) {
        continue;
      }
      const shuffledKeys = shuffle(getForeignKeys[0].values);
      shuffledKeys.length = y;

      for(let j = 0; j < y; j = j + 1) {
        result.push({
          from : {
            tbl : shuffledKeys[j][2],
            col : shuffledKeys[j][3],
          },
          to : {
            tbl : getTables[i][0],
            col : shuffledKeys[j][4],
          }
        });
      }
    }
  }

  if(result.length > 0) {
    return result;
  }

  throw new QuestionError(`A foreign key was not found`);
}

const getXRowsFrom = (tbl, col, x) => {
  const y = x || 1;
  const getRows = ts.db.exec(`SELECT "${col}" FROM "${tbl}" ORDER BY RANDOM() LIMIT ${y}`);

  if(getRows[0].values.length < y) {
    throw new QuestionError(`The table doesn't contain enough rows`);
  }

  return getRows;
}

/**
 * Dynamic question functions
 **/

const basicSelect = () => {
  const [ tbl_name ] = getXTables(1);

  const question = `Select all the rows and columns from the table ${empasize(tbl_name)}`;
  const answer = `SELECT * FROM "${tbl_name}"`;

  return { question, answer };
}

const specificSelect = () => {
  const [ { tbl : [tbl_name ], col : [, col_name] } ] = getSpecificColumns(1);
  console.log(tbl_name)
  const question = `Select only the ${empasize(col_name)} rows in the table ${empasize(tbl_name)}`;
  const answer = `SELECT "${col_name}" FROM "${tbl_name}"`;

  return { question, answer };
}

const whereClause = () => {
  const [ { tbl : [tbl_name], col : [, col_name] }, { col : [, select_col_name]} ] = getSpecificColumns(2);
  const [ { values : [row_value] } ] = getXRowsFrom(tbl_name, col_name, 1);

  const question = `Select all ${empasize(select_col_name)} rows where ${empasize(col_name)} is ${empasize(row_value)} in the table ${empasize(tbl_name)}`;
  const answer = `SELECT "${select_col_name}" FROM "${tbl_name}" WHERE "${col_name}" = '${row_value}'`;

  return { question, answer };
}

/**
 * Array of objects containing information about the questions
 * Must follow a linear pattern with regards to numbering (no gaps!)
 * !! Must be after the function declarations !!
 **/
let questionFunctions = [
  {
    number : 1,
    theme : `Selecting all the columns in a SELECT operation`,
    func : basicSelect,
  },
  {
    number : 2,
    theme : `Selecting a specific column in a SELECT operation`,
    func: specificSelect,
  },
  {
    number : 3,
    theme : `Introducing the WHERE clause`,
    func: whereClause,
  },
];
