/* Gets a random int
 * @param {int} min - the minimum value (inclusive)
 * @param {int} max - the maximum value (exclusive)
 * @return {int} - random
 */
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Gets table(s) from the SQLite database
 * @param {int} n - the amount of tables to fetch
 * @param {bool} strict - can we NOT budge?
 * @return {array} - array of the table name(s)
 */
function getTables(n, strict) {
	strict = (typeof strict !== 'undefined') ? strict : true
	
	var result = db.exec("SELECT `tbl_name` FROM `sqlite_master` WHERE `tbl_name` != 'sqlite_sequence'")

	//if not enough tables, return false
	if(result[0].values.length < n && strict) {
		return false
	} else if(n > result[0].values.length) { // can't get more tables then their is!
		n = result[0].values.length
	}
	
	// store previous table indexes to get unique tables!
	var out = [], prev = [], random = -1
	
	// else grab random unique tables!
	for(var i = 0; i < n; i++) {
		// keep searching for a unique!
		do { 
			random = Math.floor(Math.random() * result[0].values.length)
		} while (prev.indexOf(random) > -1)
		prev[prev.length] = random
		
		out[out.length] = result[0].values[random]
	}
	// return the array of table names
	return out
}

/* Gets column(s) from the SQLite database that is an Int Datatype if any!
 * Will loop through all the tables!
 * @param {string} tbl_name - specific table
 * @return {array} - array of the column name(s)
 */
function getIntColumn(tbl_name) {
	// get all (10 is enough right?) the tables to check!
	var tables = getTables(10, false)
	
	// check a specific table!
	if(typeof tbl_name !== 'undefined') {
		tables = [[tbl_name]]
	}
	
	for(var i = 0; i < tables.length; i++) {
		var check = db.exec('PRAGMA table_info(' + tables[i] + ')')
		
		//loop through columns
		for(var j = 0; j < check[0].values.length; j++) {
			if(check[0].values[j][2] === 'INTEGER') {
				// found an int column break all loops to save time!!
				
				return { tbl_name : tables[i][0], col_name : check[0].values[j][1] }
			}
		}
	}
}

/* Gets column(s) from the SQLite database
 * @param {string} tbl_name - the table to get the column(s) from
 * @param {int} n - the amount of columns to fetch
 * @param {param} strict - can't budge on the columns
 * @return {array} - array of the column name(s)
 */
function getColumns(tbl_name, n, strict) {
	strict = (typeof strict !== 'undefined') ? strict : true

	var result = db.exec("SELECT * FROM `" + tbl_name + "`")
	
	// does the table have rows?
	if(typeof result[0] === 'undefined') {
		return false
	}
	
	//if not enough tables and is strict, return false
	if(result[0].columns.length < n && strict) {
		return false
	} else if(result[0].columns.length < n && !strict) {
		n = result[0].columns.length
	}

	// store previous column indexes to get unique columns!
	var out = [], prev = [], random = -1
	
	// else grab random unique columns!
	for(var i = 0; i < n; i++) {
		// keep searching for a unique!
		do { 
			random = Math.floor(Math.random() * result[0].columns.length)
		} while (prev.indexOf(random) > -1)
		prev[prev.length] = random
		
		out[out.length] = result[0].columns[random]
	}
	// return the array of column names
	return out
}

/* Gets row(s) from the SQLite database
 * @param {string} tbl_name - the table to get the row(s) from
 * @param {string} col_name - the column to get the row(s) from
 * @param {int} n - the amount of rows to fetch
 * @param {bool} strict - this amount is required, no budging!!
 * @return {array} - array of the rows name(s)
 */
function getRows(tbl_name, col_name, n, strict) {
	strict = (typeof strict !== 'undefined') ? strict : true
	
	var result = db.exec("SELECT " + col_name + " FROM `" + tbl_name + "`")
	
	//if not enough tables and is strict, return false
	if(result[0].values.length < n && strict) {
		return false
	} else if(result[0].values.length < n && !strict) {
		n = result[0].values.length
	}

	// store previous row indexes to get unique rows!
	var out = [], prev = [], random = -1
	
	// else grab random unique rows!
	for(var i = 0; i < n; i++) {
		// keep searching for a unique!
		do { 
			random = Math.floor(Math.random() * result[0].values.length)
		} while (prev.indexOf(random) > -1)
		prev[prev.length] = random
		
		out[out.length] = result[0].values[random]
	}
	
	// return the array of row names
	return out
}

/* Init a question
 * @param {int} question - the question number!
 * @return {object} - object containing question information
 */
function getQuestion(question) {
	var fn = window["Question"+question]
	if(typeof fn === 'function') {
		//wrap as try catch, to catch errors such as empty tables...
		try {
			var result = fn.apply()
			return result
		} catch(e) {
			console.log(e)
			return 'Error constructing question... Restore database and refresh the page!'
		}
	}
}

/**
 * Question 1: Select all columns 
 * Sample: SELECT * FROM tbl_name
 */
function Question1() {
	var cache = Cookies.getJSON('Question-1')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		
		var Q = 'Select everything from the table <em>' + tbl_name + '</em>'
		var A = 'SELECT * FROM `' + tbl_name + '`'
	
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-1", JSON.stringify(cache))
	}
	return cache.Question
}	

/**
 * Question 2: Select specific columns
 * Sample: SELECT `col_name` FROM `tbl_name`
 **/
function Question2() {
	var cache = Cookies.getJSON('Question-2')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		var col_name = getColumns(tbl_name, 1)
		
		var Q = 'Select ONLY the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em>'
		var A = 'SELECT ' + col_name + ' FROM `' + tbl_name + '`'
	
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-2", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 3: Select specific rows
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` = value
 **/
function Question3() {
	var cache = Cookies.getJSON('Question-3')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		var col_name = getColumns(tbl_name, 1)
		
		var row_value = getRows(tbl_name, col_name, 1)
	
		var Q = 'Select the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is equal to "' + row_value + '"'
		var A = 'SELECT `' + col_name + '` FROM `' + tbl_name + '` WHERE `' + col_name + '` = "' + row_value + '"'
	
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-3", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 4: Introducing greater/less than
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value
 **/
function Question4() {
	var cache = Cookies.getJSON('Question-4')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		var col_name = getColumns(tbl_name, 1)
		
		var row_value = getRows(tbl_name, col_name, 1)
		
		// generate random numbers
		var randomOp = getRandomInt(0, 1), randomSel = getRandomInt(0, 1)
		
		// randomise the columns selected and the where operator!
		var operators = {	Q : ['greater or equal', 'below or equal'], A : ['>=', '<='] }
		var selectVariance = { Q : ['everything', col_name], A : ['*', '`' + col_name + '`' ]}
	
		var Q = 'Select <em>' + selectVariance.Q[randomSel] + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is ' + operators.Q[randomOp] + ' to "' + row_value + '"'
		var A = 'SELECT ' + selectVariance.A[randomSel] + ' FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + operators.A[randomOp] + ' "' + row_value + '"'
	
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-4", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 5: Introducing AND in where clause
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value and `col_name_2` <= value2
 **/
function Question5() {
	var cache = Cookies.getJSON('Question-5')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		
		// get the data from these columns
		var col_name = getColumns(tbl_name, 2)
		// ask to display these columns
		var named_cols = getColumns(tbl_name, 2)
		
		// returns two values from different columns for the same row
		var rows = getRows(tbl_name, col_name, 1) 
		
		// construct the query
		var Q = 'Select the columns <em>' + named_cols.join(' and ') + '</em> from the table <em>' + tbl_name + '</em> where'
		var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE'
		
		for(var i = 0; i < rows[0].length; i++) {
			var random = getRandomInt(0, 1)
			var operators = {	name : ['greater or equal', 'below or equal'], operator : ['>=', '<='] }
			
			if(i > 0) {
				Q = Q + ', and'
				A = A + ' AND'
			}
			
			Q = Q + ' <em>' + col_name[i] + '</em> is ' + operators.name[random] + ' to ' + rows[0][i]
			A = A + ' ' + col_name[i] + ' ' + operators.operator[random] + ' "' + rows[0][i] + '"'
		}

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-5", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 6: Introducing OR in where clause
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value or `col_name_2` <= value2
 **/
function Question6() {
	var cache = Cookies.getJSON('Question-6')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined')
	{
		var tbl_name = getTables(1)
		
		// get the data from these columns
		var col_name = getColumns(tbl_name, 2)
		// ask to display these columns
		var named_cols = getColumns(tbl_name, 2)
		
		// construct the query
		var Q = 'Select the columns <em>' + named_cols.join(' and ') + '</em> from the table <em>' + tbl_name + '</em> where the value of'
		var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE'

		for(var i = 0; i < col_name.length; i++)
		{
			var random = getRandomInt(0, 4)
			var operators = {	name : ['greater or equal to', 'below or equal to', 'below', 'above', 'equal to'], operator : ['>=', '<=', '<', '>', '='] }

			// returns two values from different columns for the same row
			var rows = getRows(tbl_name, col_name[i], 1)
			
			if(i > 0) {
				Q = Q + ', or'
				A = A + ' or'
			}
			
			Q = Q + ' <em>' + col_name[i] + '</em> is ' + operators.name[random] + ' "' + rows[0] + '"'
			A = A + ' ' + col_name[i] + ' ' + operators.operator[random] + ' "' + rows[0] + '"'
		}
		
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-6", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 7: Introducing IN
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` IN(value, value2)
 **/
function Question7() {
	var cache = Cookies.getJSON('Question-7')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		// get the data from these columns
		var col_name = getColumns(tbl_name, 1)
		// ask to display these columns
		var named_cols = getColumns(tbl_name, 2)
		
		// generate random numbers
		var randomOp = getRandomInt(0, 1), randomSel = getRandomInt(0, 1), random_row_num = getRandomInt(4, 6)

		var rows = getRows(tbl_name, col_name, random_row_num, false) // strict

		// randomise the columns selected and the where operator!
		var selectVariance = { Q : ['everything', named_cols], A : ['*', '`' + named_cols.join('`, `') + '`' ]}
	
		var Q = 'Select <em>' + selectVariance.Q[randomSel] + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is either: ' + rows.join(', or ') + '. Using IN()'
		var A = 'SELECT ' + selectVariance.A[randomSel] + ' FROM `' + tbl_name + '` WHERE `' + col_name + '` IN("' + rows.join('", "') + '")'
		
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-7", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 8: Introducing Distinct
 * Sample: SELECT DISTINCT `col_name`, `col_name_2` FROM `tbl_name`
 **/
function Question8() {
	var cache = Cookies.getJSON('Question-8')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		// get the data from these columns
		var col_name = getColumns(tbl_name, 1)
		
		var Q = 'Select the DISTINCT values from the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em>'
		var A = 'SELECT DISTINCT ' + col_name + ' FROM `' + tbl_name + '`'
		
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-8", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 9: Introducing Order by ... ASC / DESC
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` WHERE `col_name` = 'a' ORDER BY `col` ASC/DESC
 **/
function Question9() {
	var cache = Cookies.getJSON('Question-9')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		
		// generate random numbers
		var randomCol = getRandomInt(1, 3), randomOrderBy = getRandomInt(0, 1)
		
		var orderBy = {	Q : ['in ascending order', 'in descending order'], A : ['ASC', 'DESC'] }

		// select from these columns
		var named_col = getColumns(tbl_name, randomCol, false)
		// order by col_name
		var order_col = getColumns(tbl_name, 1)
		
		var Q = 'Select <em>' + named_col.join(', ') + '</em> from the table <em>' + tbl_name + '</em> ordering them by the column <em>' + order_col + '</em>, ' + orderBy.Q[randomOrderBy]
		var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` ORDER BY `' + order_col + '` ' + orderBy.A[randomOrderBy]

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-9", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 10: Introducing LIMIT
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` LIMIT x
 **/
function Question10() {
	var cache = Cookies.getJSON('Question-10')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		
		// generate random numbers
		var randomCol = getRandomInt(1, 3), randomLimit = getRandomInt(5, 15)
		
		// select from these columns
		var named_col = getColumns(tbl_name, randomCol, false)

		var Q = 'Select ' + randomLimit + ' rows from the table <em>' + tbl_name + '</em>, displaying the columns <em>' + named_col.join(', and ') + '</em>'
		var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` LIMIT ' + randomLimit

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-10", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 11: Introducing LIMIT offset
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` LIMIT x, y
 **/
function Question11() {
	var cache = Cookies.getJSON('Question-11')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		
		// generate random numbers
		var randomCol = getRandomInt(1, 3), randomLimit = getRandomInt(5, 15), randomOffset = getRandomInt(5, 10)
		
		// select from these columns
		var named_col = getColumns(tbl_name, randomCol, false)

		var Q = 'Select ' + randomLimit + ' rows starting at the row ' + randomOffset + ' (OFFSET ' + (randomOffset-1) + '), from the table <em>' + tbl_name + '</em>, displaying the columns <em>' + named_col.join(', and ') + '</em>'
		var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` LIMIT ' + (randomOffset-1) + ', ' + randomLimit 

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-11", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 12: Introducing Count
 * Sample: SELECT Count(`col_name`), `col_name_2` FROM `tbl_name`
 **/
function Question12() {
	var cache = Cookies.getJSON('Question-12')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		
		// get the column to count, not strict but tables usually have 2+ cols, right?
		var col_name = getColumns(tbl_name, 1)
	
		var Q = 'Select the number of rows from the table ' + tbl_name
		var A = 'SELECT COUNT(*) FROM `' + tbl_name + '`'

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-12", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 13: Using Count and the Where clause
 * Sample: SELECT Count(`col_name`), `col_name_2` FROM `tbl_name` WHERE `col_name` <=> val
 **/
function Question13() {
	var cache = Cookies.getJSON('Question-13')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)

		// generate randoms 
		var randomOp = getRandomInt(0, 3)
		
		// get the column in where
		var col_name = getColumns(tbl_name, 1)
		
		// available operators
		var row = getRows(tbl_name, col_name, 1)
		var operators = { Q : ['above or equal to', 'below or equal to', 'above', 'below'], A : ['>=', '<=', '>', '<'] }
		
		var Q = 'Select the number of rows from the table ' + tbl_name + ' where the value of ' + col_name + ' is ' + operators.Q[randomOp] + ' "' + row + '"'
		var A = 'SELECT COUNT(*) FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + operators.A[randomOp] + ' "' + row + '"'

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-13", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 14: Introducing MAX, MIN, AVG
 * Sample: SELECT MIN(`col_name`), MAX(`col_name_2`) FROM `tbl_name`
 **/
function Question14() {
	var cache = Cookies.getJSON('Question-14')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)

		// get the column in where
		var col_name = getColumns(tbl_name, 3)
		
		var Q = 'Select the '
		var A = 'SELECT '
		
		// available functions
		var functions = { Q : ['maximum', 'minimum', 'average'], A : ['MAX', 'MIN', 'AVG'] }
		for(var i = 0; i < col_name.length; i++) {
			
			if(i == 1) {
				Q = Q + ', '
				A = A + ', '
			} else if(i == 2) {
				Q = Q + ' and '
				A = A + ', '
			}
			
			Q = Q + functions.Q[i] + ' value of the column <em>' + col_name[i] + '</em>'
			A = A + functions.A[i] + '(`' + col_name[i] + '`)'
		}
		
		Q = Q + ' from the table <em>' + tbl_name + '</em>'
		A = A + ' FROM `' + tbl_name + '`'

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-14", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 15: Introducing Group By
 * Sample: SELECT Count(`col_name`) FROM `tbl_name` Group by `col_name`
 **/
function Question15() {
	var cache = Cookies.getJSON('Question-15')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)

		// generate randoms 
		var randomFunc = getRandomInt(0, 2)
		
		// get the column in where
		var col_name = getColumns(tbl_name, 1)
		// get the group by column
		var group_col = getColumns(tbl_name, 1)
		
		var Q = 'Select the '
		var A = 'SELECT '
		
		// available functions
		var functions = { Q : ['maximum', 'minimum', 'average'], A : ['MAX', 'MIN', 'AVG'] }
		
		Q = Q + functions.Q[randomFunc] + ' value of the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em> grouping the results by the column ' + group_col
		A = A + functions.A[randomFunc] + '(`' + col_name + '`) FROM `' + tbl_name + '` GROUP BY `' + group_col + '`' 

		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-15", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 16: Introducing Nested Queries
 * Sample: SELECT * FROM `tbl_name` WHERE `col_name` > (SELECT AVG(`col_value`) FROM `tbl_name`)
 **/
function Question16() {
	var cache = Cookies.getJSON('Question-16')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		// get a column that is only fill with INT's. 
		// 				{tbl_name: x, col_name: y}
		var info = getIntColumn()
		
		// generate randoms 
		var randomCol = getRandomInt(1, 2), randomOp = getRandomInt(0, 3)
		
		var named_col = getColumns(info.tbl_name, randomCol)
		
		var operators = {	Q : ['greater or equal to', 'below or equal to', 'below', 'above'], A : ['>=', '<=', '<', '>'] }
		
		var Q = 'Select the rows from <em>' + named_col.join(', ') + '</em> in <em>' + info.tbl_name + '</em> where the value of <em>' + info.col_name + '</em> is ' + operators.Q[randomOp] + ' the average of the column <em>' + info.col_name + '</em>'
		var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + info.tbl_name + '` WHERE `' + info.col_name + '` ' + operators.A[randomOp] + ' (SELECT AVG(`' + info.col_name + '`) FROM `' + info.tbl_name + '`)'
		
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-16", JSON.stringify(cache))
	}
	return cache.Question
}

/**
 * Question 17: Introducing ISNULL, ISNOT
 * Sample: SELECT * FROM `tbl_name` WHERE `col_name` IS NULL/IS NOT NULL
 **/
function Question17() {
	var cache = Cookies.getJSON('Question-17')
	
	//check if we have a stored version already saved? if not make one...
	if(typeof cache === 'undefined') {
		var tbl_name = getTables(1)
		
		// generate randoms 
		var randomCols = getRandomInt(1, 2), randomNull = getRandomInt(0, 1)
		
		var col_name = getColumns(tbl_name, 1)
		// select these
		var named_cols = getColumns(tbl_name, randomCols)
		
		// random null or not null
		var nulls = {	Q : ['null values', 'not null values'], A : ['IS NULL', 'IS NOT NULL'] }
		
		var Q = 'Select the columns <em>' + named_cols.join(', ') + '</em> from the table <em>' + tbl_name + '</em> where the rows in the <em>' + col_name + '</em> column contains only <strong>' + nulls.Q[randomNull] + '</strong> values'
		var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + nulls.A[randomNull]
		
		//set the cache
		cache = {Question: Q, Answer: A}
		Cookies.set("Question-17", JSON.stringify(cache))
	}
	return cache.Question
}

/* Check the answer
 * @param {json} inputResult - the user input containing their sql output in json.stringify!
 * @return {bool} - correct or not?
 */
function checkAnswer(inputResult) {
	
	// get the current question from cookie
	var currQuestion = (typeof Cookies.get('CurrQuestion') !== 'undefined') ? Cookies.get('CurrQuestion') : 1
	// get the model answer from the cache (generated when a question was stored)
	var cache = Cookies.getJSON('Question-' + currQuestion)
	
	// if the answer isn't in the cache, WTF happened?!?!
	if(typeof cache === 'undefined') {
		return false
	}
	
	var answerResult = db.exec(cache.Answer)
	
	/* BugFix
	 * If the question generated no longer returns values, then mark it as correct!
	 */
	if(typeof answerResult[0] === 'undefined' && typeof inputResult[0] === 'undefined') {
		return true
	}
	
	// make the input columns capitalised as it's valid whatever case!
	for(var i = 0; i < inputResult[0].columns.length; i++) {
		inputResult[0].columns[i] = inputResult[0].columns[i].toUpperCase().replace(/\`/g, "")
	}
	
	// make the answer columns capitalised as it's valid whatever case!
	for(var i = 0; i < answerResult[0].columns.length; i++) {
		answerResult[0].columns[i] = answerResult[0].columns[i].toUpperCase().replace(/\`/g, "")
	}
	
	// stringify strings
	var answer = JSON.stringify(answerResult)
	var input = JSON.stringify(inputResult)
	
	// check if the input is the same as the answer
	if(input === answer) {
		// correct 
		return true
	}
	// nope
	return false
}