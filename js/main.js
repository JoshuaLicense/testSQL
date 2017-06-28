/**
 * Shuffles array in place.
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a
}

// Base64 Object
// https://scotch.io/tutorials/how-to-encode-and-decode-strings-with-base64-in-javascript
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function(e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    },
    decode: function(e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9+/=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    },
    _utf8_encode: function(e) {
        e = e.replace(/rn/g, "n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    },
    _utf8_decode: function(e) {
        var t = "";
        var n = 0;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
}

// database object
var db = null
var data = window.localStorage.getItem('DefaultDB')

// get the current question
var currQuestion = (typeof Cookies.get('CurrQuestion') !== 'undefined') ? parseInt(Cookies.get('CurrQuestion')) : 1
// progress
var QuestionProgress = (typeof Cookies.get('QuestionProgress') !== 'undefined') ? JSON.parse(Base64.decode(Cookies.get('QuestionProgress'))) : []

var QuestionsArray = [{
    'type': 'Selecting all columns',
}, {
    'type': 'Selecting specific columns',
}, {
    'type': 'Introducing the WHERE clause',
}, {
    'type': 'Introducing operators into the WHERE clause',
}, {
    'type': 'Introducing AND in the WHERE clause',
}, {
    'type': 'Introducing OR in the WHERE clause',
}, {
    'type': 'Introducing IN()',
    'newgroup': true,
}, {
    'type': 'Introducing DISTINCT',
}, {
    'type': 'Introducing ORDER BY',
}, {
    'type': 'Introducing LIMIT',
}, {
    'type': 'Introducing LIMIT offset',
}, {
    'type': 'Introducing COUNT()',
    'newgroup': true,
}, {
    'type': 'Combining COUNT() with WHERE clause',
}, {
    'type': 'Introducing AVG(), MIN(), MAX() functions',
}, {
    'type': 'Introducing Group By',
}, {
    'type': 'Introducing Nested Queries',
}, {
    'type': 'Introducing IS NULL and IS NOT NULL',
}, {
    'type': 'Introducing Inner Joins',
    'newgroup': true,
}, {
    'type': 'Introducing Left Joins',
}, {
    'type': 'Introducing table aliases',
}, {
    'type': 'Introducing column aliases',
}, {
    'type': 'Introducing LIKE clauses',
}]

// @param: database object 
function saveDB(db) {
    var result = db.export(),
        strings = [],
        chunksize = 0xffff
    for (var i = 0; i * chunksize < result.length; i++)
        strings.push(String.fromCharCode.apply(null, result.subarray(i * chunksize, (i + 1) * chunksize)));
    window.localStorage.setItem('DefaultDB', strings.join(''));
}

// export the binary database
function saveToFile(db) {
	var result = db.export()
	var blob = new Blob([result]);
	
	var a = document.createElement("a");
	a.href = window.URL.createObjectURL(blob);
	a.download = 'sql.db';
	a.onclick = function() {
		setTimeout(function() {
			window.URL.revokeObjectURL(a.href);
		}, 1500);
	};
	a.click();
}

// fresh database!
function DefaultDB() {
    // fetch the database!
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'database/DefaultDatabase.db', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
        var uInt8Array = new Uint8Array(this.response);
        // set to global db
        db = new SQL.Database(uInt8Array);
        saveDB(db)
        updateView(true)
    };
    xhr.send();
}

function removeCookies() {
    // remove all the cookies for the questions
    for (var c in Cookies.get()) {
        Cookies.remove(c)
    }
}

// construct the sidebar to display the tables in the current database
function showTables() {
    var html = "",
        results = db.exec("SELECT `tbl_name` FROM `sqlite_master` WHERE `type`='table'")

    for (var i = 0; i < results[0].values.length; i++) {
        var tbl_name = results[0].values[i][0];
        var count = db.exec("SELECT COUNT(*) FROM `" + tbl_name + "`");

        html = html + '<li data-tbl-name="' + tbl_name + '"><a>' + tbl_name + '<span class="badge pull-right">' + count[0].values[0][0] + '</span></a></li>'
    }
    $('#tables-SQL').html(html)
}

// grab the default text and save it
var defaultResultsText = $('#results-SQL').html()

// update the sidebar!
function updateView(full) {
    full = (typeof full !== 'undefined') ? full : false
    if (full === true) {
        // get the current question
        currQuestion = (typeof Cookies.get('CurrQuestion') !== 'undefined') ? parseInt(Cookies.get('CurrQuestion')) : 1
        // progress
        QuestionProgress = (typeof Cookies.get('QuestionProgress') !== 'undefined') ? JSON.parse(Base64.decode(Cookies.get('QuestionProgress'))) : []

        updateQuestons()
    }
    showTables()
}

// clean the webpage from user input! 
// @param {bool} full - removes the editable area contents if TRUE!
function cleanView(full) {
    full = (typeof full !== 'undefined') ? full : false

    hideFeedback()
    $('#results-SQL').html(defaultResultsText)

    if (full === true) {
        editableCodeMirror.setValue("")
    }
}

// restore tables back to the default trusty database!
function restore() {
    // grab all tables
    var results = db.exec("SELECT DISTINCT `tbl_name` FROM `sqlite_master` WHERE tbl_name != 'sqlite_sequence'")

    // and remove them one-by-one
    for (var i = 0; i < results[0].values.length; i++) {
        var tbl_name = results[0].values[i][0]

        db.exec("DROP TABLE `" + tbl_name + "`");
    }

    // remove all the cookies for the questions
    for (var c in Cookies.get()) {
        Cookies.remove(c)
    }

    // update it (Update this to a file!)
    DefaultDB()
    // then save it
    saveDB(db)

    // clean up the views and remove the cookies
    removeCookies()
    cleanView(true)
}

// if the database is in the local storage get it!
if (data !== null) {
    var result = []
    for (var i = 0, size = data.length; i < size; i++)
        result.push(data.charCodeAt(i));
    result = new Uint8Array(result);

    // load the database!
    db = new SQL.Database(result)
    // update view
    updateView(true)
} else {
    // no database exists in local storage, make a default one!
    DefaultDB()
}

// NOT USED
// get the database from the hidden table in the database
function getQuestionInCache(num) {
    db.run('CREATE TABLE IF NOT EXISTS `testsql_questions` (num int, question text, answer text, include text)')

    var questionCache = db.exec('SELECT `question`, `answer`, `include` FROM `testsql_questions` WHERE `num` = ' + parseInt(num))

    console.log(db.exec('SELECT * FROM testsql_questions'))
    if (questionCache.length > 0) {
        // contruct an object
        var Question = questionCache[0].values[0][0]
        var Answer = questionCache[0].values[0][1]
        var Include = questionCache[0].values[0][2]
        return {
            Question,
            Answer,
            Include
        }
    } else {
        return null
    }
}

// NOT USED
// save the question in a hidden table in the database
function saveQuestionInCache(Num, Question, Answer, Include) {
    Include = (typeof Include !== 'undefined') ? JSON.stringify(Include) : "{}"
    db.run('INSERT INTO `testsql_questions` VALUES(' + Num + ', "' + Question + '", "' + Answer + '", "' + Include + '")')
    saveDB(db)
}

// Create a HTML table - helper function
var tableCreate = function() {
    // private function
    function valconcat(vals, tagName) {
        if (vals.length === 0) return '';
        var open = '<' + tagName + '>',
            close = '</' + tagName + '>';
        return open + vals.join(close + open) + close;
    }
    // public 
    return function(columns, values) {

        var html = '<thead>' + valconcat(columns, 'th') + '</thead>';
        var rows = values.map(function(v) {
            return valconcat(v, 'td');
        });
        html += '<tbody>' + valconcat(rows, 'tr') + '</tbody>';
        return html;
    }
}();

// check if the query alters the database, return true if so!
function checkDBChanges(x) {
    if (
        x.toUpperCase().indexOf("INSERT INTO ") > -1 ||
        x.toUpperCase().indexOf("UPDATE ") > -1 ||
        x.toUpperCase().indexOf("DELETE ") > -1 ||
        x.toUpperCase().indexOf("ALTER TABLE ") > -1 ||
        x.toUpperCase().indexOf("DROP TABLE ") > -1 ||
        x.toUpperCase().indexOf("INTO ") > -1 ||
        x.toUpperCase().indexOf("CREATE TABLE ") > -1 ||
        x.toUpperCase().indexOf("ALTER TABLE ") > -1 ||
        x.toUpperCase().indexOf("CREATE VIEW ") > -1 ||
        x.toUpperCase().indexOf("REPLACE VIEW ") > -1 ||
        x.toUpperCase().indexOf("DROP VIEW ") > -1 ||
        (x.toUpperCase().indexOf("CREATE INDEX") > -1) ||
        (x.toUpperCase().indexOf("CREATE UNIQUE INDEX") > -1) ||
        (x.toUpperCase().indexOf("DROP INDEX") > -1)
    ) {
        return true;
    }
    return false;
}

// update the questions, wrapped in function to remove bug of the side-loading that xml does!
function updateQuestons() {
    // Construct questions!
    var html = '<div class="btn-group" role="group">'
    for (var i in QuestionsArray) {

        //if(QuestionsArray[i].newgroup) {
        //html = html + '</div><div class="btn-group" role="group">'
        //}
        // start the questions at 1!
        var j = parseInt(i) + 1

        // check if the question has been completed?
        var check = QuestionProgress.indexOf(j)

        // add the button to the questions block
        html = html + '<button id="btn-q' + j + '" class="btn btn-default' + (check > -1 ? ' btn-success' : '') + ((j == Math.abs(currQuestion)) ? ' active' : '') + '"' + (isSandboxMode() ? ' disabled="disabled"' : '') + '>' + j + '</button>'
    }
    html = html + '</div>'

    // add it to the DOM
    $('#questions-SQL').html(html)

    if (isCompleted(currQuestion) === true) {
        // show model answer!
        var cache = Cookies.get('Question-' + currQuestion)
        // if the answer isn't in the cache, dont try show answer
        if (typeof cache !== 'undefined') {
            // decode the cookie
            cache = Base64.decode(cache)
            // parse the string into a JSON object
            cache = JSON.parse(cache)

            editableCodeMirror.setValue(cache.Answer)
        }
    }

    $('#status-SQL').toggle(QuestionProgress.indexOf(currQuestion) > -1 ? true : false)
    $('#currQuestionTitle-SQL').html((typeof QuestionsArray[currQuestion - 1] !== 'undefined') ? 'Question #' + currQuestion + ' ' + QuestionsArray[currQuestion - 1].type : 'Sandbox Mode')
    $('#currQuestion-SQL').html(isSandboxMode() ? 'Questions are <strong>disabled</strong> in sandbox mode.' : getQuestion(currQuestion))
}

// update question on click
$('#questions-SQL').on('click', 'button', function() {
    var ele = parseInt($(this).html())

    // don't do anything if we already on the question
    if (ele != currQuestion) {
        // find all the buttons with `primary` class, remove!
        $('#questions-SQL>div>button.active').removeClass('active')
        $(this).addClass('active')

        currQuestion = ele
        // update the cookie!
        Cookies.set('CurrQuestion', ele)

        if (isCompleted(ele) === true) {
            // show model answer!
            var cache = Cookies.get('Question-' + currQuestion)
            // if the answer isn't in the cache, dont try show answer
            if (typeof cache !== 'undefined') {
                // decode the cookie
                cache = Base64.decode(cache)
                // parse the string into a JSON object
                cache = JSON.parse(cache)

                editableCodeMirror.setValue(cache.Answer)
            }
        } else {
            editableCodeMirror.setValue('')
        }

        $('#status-SQL').toggle(isCompleted(ele))
        $('#currQuestionTitle-SQL').html('Question #' + ele + ' ' + QuestionsArray[ele - 1].type)
        $('#currQuestion-SQL').html(getQuestion(ele))
    }
})

// binding arrow keys for improved accessibility
// e.which for cross-broswer compatability
// http://api.jquery.com/event.which/
$(document).keydown(function(e) {
    // don't call if cursor inside textarea
    if ($(e.target).is('textarea')) {
        // both enter key and ctrl key
        if (e.which == 13 && e.ctrlKey) {
            // execute the sql
            execute(editableCodeMirror.getValue());
        }
    } else {
        if (e.which == 37) { // left arrow
            // simulate a click of the previous question
            $('#btn-q' + (currQuestion - 1)).trigger('click');
        } else if (e.which == 39) { // right arrow
            // simulate a click of the next question
            $('#btn-q' + (currQuestion + 1)).trigger('click');
        }
    }
})

// functionality for the RunSql button
$('#exec-SQL').click(function() {
    execute(editableCodeMirror.getValue())
});

//functionality for the side menu
$('#tables-SQL').on("click", "li", function() {
    var sql = "SELECT * FROM `" + $(this).data("tbl-name") + "`"
    editableCodeMirror.setValue(sql)
    execute(sql, false)
});

// functionality for the restore database function
$('#restore-SQL').click(function() {
    restore()
});

//functionality for the clear text area!
$('#clear-SQL').click(function() {
    cleanView(true)
});

// functionality for the sandbox mode!
$('#sandbox-SQL button:enabled').click(function() {
    $('#sandbox-SQL>div>button:enabled').toggleClass('active btn-default btn-danger')

    Cookies.set('CurrQuestion', parseInt(currQuestion) * -1)
    currQuestion = currQuestion * -1

    // parseint as I have no idea why CurrQuestion is cast back to a string?!?	
    $('#status-SQL').toggle(QuestionProgress.indexOf(parseInt(currQuestion)) > -1 ? true : false)
    $('#currQuestionTitle-SQL').html(QuestionsArray[currQuestion - 1] ? 'Question #' + currQuestion + ' ' + QuestionsArray[currQuestion - 1].type : 'Sandbox Mode')
    $('#currQuestion-SQL').html(isSandboxMode() ? 'Questions are <strong>disabled</strong> in sandbox mode.' : getQuestion(currQuestion))

    // re-enable/disable question buttons
    $('#questions-SQL').find('button').prop('disabled', isSandboxMode());
})
$('#sandbox-SQL>div>button:enabled:nth(' + (isSandboxMode() ? 1 : 0) + ')').addClass('active btn-danger').removeClass('btn-default')

//Run a command in the database
function execute(commands, check) {
    try {
        // hide the feedback from previous attempt (if any)
        $('#response-SQL').parent().hide()

        // don't check answer if someone clicks on the sidebar tables for example!
        check = (typeof check !== 'undefined') ? check : true

        // only make changes if sandbox mode!
        if (checkDBChanges(commands) && !isSandboxMode()) {
            $('#response-SQL').addClass('alert-danger').html('You can only make changes to the database when sandbox mode is enabled!').show().delay(3000).fadeOut(function() {
                $(this).removeClass('alert-danger')
            })
            return
        }
        // if it is sandbox and changes can be made... make them!
        var results = db.exec(commands)

        // if it changes the database save the changes
        if (checkDBChanges(commands)) {
            saveDB(db)
            updateView(false)

            //Don't check db changes as all questions relate to SELECT
            check = false
        }
        // only clean if selecting something!
        else {
            cleanView(false)
        }
        currQuestion = (typeof Cookies.get('CurrQuestion') !== 'undefined') ? Cookies.get('CurrQuestion') : 1

        // if sandbox mode don't even check the cache for the answer just let them play
        if (isSandboxMode() === true || check === false) {
            showFeedback('Query executed successfully', 'alert-success');
        } else if (isCompleted(currQuestion)) {
            showFeedback('Well done! The answer was correct', 'alert-success');
        } else {
            var feedback = checkAnswer(results, commands);
            if (feedback === true) {
                //--- correct answer! ---//
                $('#btn-q' + currQuestion).addClass('btn-success')

                // store the completed questions in a cookie! form of [1, 2 ... 5, 7]
                markComplete(currQuestion)

                // display the success ribbon
                showFeedback('Well done! The answer was correct', 'alert-success');

                // Move on to the next incomplete question in order!
                $('#questions-SQL>div>button:not(.btn-success):first').trigger('click')
            } else {
                // incorrect
                showFeedback(feedback, 'alert-danger');
            }
        }

        var html = ''
        if (results.length === 0) {
            html = '<em> No rows returned </em>'
        } else {
            for (var i = 0; i < results.length; i++) {

                html = html + "<div style='margin-bottom:10px;'>Number of Records: " + results[i].values.length + " " + (results[i].values.length > 10 ? ' (Showing first 10 results)' : '') + "</div>";
                html = html + "<table class='table table-striped table-bordered'>"

                // limit results
                results[i].values.length = (results[i].values.length > 10 ? 10 : results[i].values.length)
                html = html + tableCreate(results[i].columns, results[i].values)
            }
            html = html + "</table>"
        }

        $('#results-SQL').html(html)
    }
    //Error running the query! Display error message
    catch (e) {
        showFeedback(e, 'alert-danger');
    }
}

// @param feedback - html to display
// @param alertClass - class to add to the alert message, e.g. 'alert-success'
function showFeedback(feedback, alertClass) {
    $('#response-SQL').parent().removeClass('alert-success alert-danger')
    $('#response-SQL').parent().addClass(alertClass).show()
    $('#response-SQL').html(feedback)
}

function hideFeedback() {
    $('#response-SQL').parent().hide()
}

// if the current question is -1 then it's sandbox mode!
function isSandboxMode() {
    var currQuestion = (typeof Cookies.get('CurrQuestion') !== 'undefined') ? Cookies.get('CurrQuestion') : 1
    return currQuestion < 0
}

// check if the question is complete @param - question number
function isCompleted(question) {
    // progress
    var QuestionProgress = (typeof Cookies.get('QuestionProgress') !== 'undefined') ? JSON.parse(Base64.decode(Cookies.get('QuestionProgress'))) : []

    // if it exists in the array it's done!
    if (QuestionProgress.indexOf(parseInt(question)) > -1) {
        return true
    }
    return false
}

// mark question as completed @param question number
function markComplete(question) {
    // get the current progress
    var QuestionProgress = (typeof Cookies.get('QuestionProgress') !== 'undefined') ? JSON.parse(Base64.decode(Cookies.get('QuestionProgress'))) : []

    if (!isCompleted(question)) {
        QuestionProgress.push(parseInt(question))

        // then set the new cookie!
        Cookies.set('QuestionProgress', Base64.encode(JSON.stringify(QuestionProgress)))
    }
    return true
}

// import another database, remove all the questions etc.
$('.import-SQL').on('change', function() {
    var input = $(this).get(0)
    var f = input.files[0];
    var r = new FileReader();
    r.onload = function() {
        var Uints = new Uint8Array(r.result)
		var results = db.exec("SELECT * FROM `sqlite_master` WHERE tbl_name != 'sqlite_sequence' and type = 'table'")
		//db.close()
        db = new SQL.Database(Uints)
		
        // save the changes!
        saveDB(db)
		
        var results = db.exec("SELECT * FROM `sqlite_master` WHERE tbl_name != 'sqlite_sequence'")

        // get some new questions
        removeCookies()
        // and update the view!
        updateView(true)
        // clean it too 
        cleanView(true)
    }
    r.readAsArrayBuffer(f);
})

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
    if (result[0].values.length < n && strict) {
        return false
    } else if (n > result[0].values.length) { // can't get more tables then their is!
        n = result[0].values.length
    }

    // store previous table indexes to get unique tables!
    var out = [],
        prev = [],
        random = -1

    // else grab random unique tables!
    for (var i = 0; i < n; i++) {
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
 * @param {string} type - "INTEGER", "NVARCHAR"
 * @param {bool} nulls - 0: nulls, 1: not nulls, 2: any
 * @param {string} tbl_name - specific table
 * @return {array} - array of the column name(s)
 */
function getTypeColumn(type, nulls, tbl_name) {
	// fetch 10 tables - can be increased but 10 seems reasonable
    var tables = (typeof tbl_name !== 'undefined') ? [
        [tbl_name]
    ] : getTables(10, false)
	
	// default is to ALLOW nulls: 
	var nulls = (typeof nulls !== 'undefined' && nulls < 3) ? nulls : 2 
	
    tables = shuffle(tables)

    for (var i = 0; i < tables.length; i++) {
        var info = db.exec('PRAGMA table_info(' + tables[i] + ')')
        //shuffle up the columns 
        var cols = shuffle(info[0].values)

        //loop through columns
        for (var j = 0; j < cols.length; j++) {
			
			if(nulls != cols[j][3] && nulls != cols[j][5]) {
				continue;
			}
			
			if(typeof type !== 'undefined') {
				if (cols[j][2].indexOf(type) > -1) {
					// found an type column break all loops to save time!!
					return {
						tbl_name: tables[i][0],
						col_name: cols[j][1]
					}
				}
				else if (cols[j][2].indexOf('CHAR') > -1 && (type == 'INTEGER' || type == 'VARCHAR'))
				{
					return {
						tbl_name: tables[i][0],
						col_name: cols[j][1]
					}
				}
			} 
			else {
				return {
					tbl_name: tables[i][0],
					col_name: cols[j][1]
				}
			}
        }
    }
}

/* Gets a table with a valid foreign key constraint!
 * Will loop through all the tables!
 * @param {string} tbl_name - specific table
 * @return {object} - object of the column name and tables(s)
 */
function getForeign(tbl_name) {
    // get a handful of tables to check!
    var tables = (typeof tbl_name !== 'undefined') ? [
        [tbl_name]
    ] : getTables(10, false)
    // shuffle the tables so a random table is at index 0
    tables = shuffle(tables)
    // loop through each table checeking for a foreign constraint
    for (var i = 0; i < tables.length; i++) {
        var check = db.exec('PRAGMA foreign_key_list(' + tables[i] + ')')
        // check if this table has foreign keys
        if (check.length > 0) {
            // shuffle the foreign keys to prevent the same on being used over and over! 
            var temp = shuffle(check[0].values)
            // then return the first one!
            // construct the object to be returned including both tables and the linked columns
            return {
                from: {
                    tbl_name: tables[i][0],
                    col_name: temp[0][3]
                },
                to: {
                    tbl_name: temp[0][2],
                    col_name: temp[0][4]
                }
            }
        }
    }
    // no table was found, return false
    return false
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
    if (typeof result[0] === 'undefined') {
        return false
    }

    //if not enough tables and is strict, return false
    if (result[0].columns.length < n && strict) {
        return false
    } else if (result[0].columns.length < n && !strict) {
        n = result[0].columns.length
    }

    // store previous column indexes to get unique columns!
    var out = [],
        prev = [],
        random = -1

    // else grab random unique columns!
    for (var i = 0; i < n; i++) {
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
    if (result[0].values.length < n && strict) {
        return false
    } else if (result[0].values.length < n && !strict) {
        n = result[0].values.length
    }

    // store previous row indexes to get unique rows!
    var out = [],
        prev = [],
        random = -1

    // else grab random unique rows!
    for (var i = 0; i < n; i++) {
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
    // get the question function name
    var fn = window["Question" + question]
    if (typeof fn === 'function') {
        //wrap as try catch, to catch errors such as empty tables...
        try {
            // run the function
            var result = fn.apply()
            return result
        } catch (e) {
            // error occured, most likely due to a question not finding valid constraints
            console.log(e)
            return '<span class="text-muted">This question requires constraints that are not present in the current database! Please import another database!</span>'
        }
    }
}

/**
 * Question 1: Select all columns 
 * Sample: SELECT * FROM tbl_name
 */
function Question1() {
    var cache = Cookies.get('Question-1')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        var Q = 'Select everything from the table <em>' + tbl_name + '</em>'
        var A = 'SELECT * FROM `' + tbl_name + '`'

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-1", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 2: Select specific columns
 * Sample: SELECT `col_name` FROM `tbl_name`
 **/
function Question2() {
    var cache = Cookies.get('Question-2')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)
        var col_name = getColumns(tbl_name, 1)

        var Q = 'Select ONLY the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em>'
        var A = 'SELECT ' + col_name + ' FROM `' + tbl_name + '`'

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-2", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 3: Select specific rows
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` = value
 **/
function Question3() {
    var cache = Cookies.get('Question-3')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		var info = getTypeColumn(undefined, 1)
		
		var tbl_name = info.tbl_name
		var col_name = info.col_name
		
        var row_value = getRows(tbl_name, col_name, 1)

        var Q = 'Select the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is equal to "' + row_value + '"'
        var A = 'SELECT `' + col_name + '` FROM `' + tbl_name + '` WHERE `' + col_name + '` = "' + row_value + '"'

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-3", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 4: Introducing greater/less than
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value
 **/
function Question4() {
    var cache = Cookies.get('Question-4')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		var info = getTypeColumn(undefined, 1)
		
		var tbl_name = info.tbl_name
		var col_name = info.col_name
		
        var row_value = getRows(tbl_name, col_name, 1)

        // generate random numbers
        var randomOp = getRandomInt(0, 1),
            randomSel = getRandomInt(0, 1)

        // randomise the columns selected and the where operator!
        var operators = {
            Q: ['greater or equal', 'below or equal'],
            A: ['>=', '<=']
        }
        var selectVariance = {
            Q: ['everything', col_name],
            A: ['*', '`' + col_name + '`']
        }

        var Q = 'Select <em>' + selectVariance.Q[randomSel] + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is ' + operators.Q[randomOp] + ' to "' + row_value + '"'
        var A = 'SELECT ' + selectVariance.A[randomSel] + ' FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + operators.A[randomOp] + ' "' + row_value + '"'

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-4", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 5: Introducing AND in where clause
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value and `col_name_2` <= value2
 **/
function Question5() {
    var cache = Cookies.get('Question-5')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		var info = getTypeColumn(undefined, 1)
		
		var tbl_name = info.tbl_name
		var col_name = info.col_name
		
        // ask to display these columns
        var named_cols = getColumns(tbl_name, 2)

        // returns two values from different columns for the same row
        var rows = getRows(tbl_name, col_name, 1)

        // construct the query
        var Q = 'Select the columns <em>' + named_cols.join(' and ') + '</em> from the table <em>' + tbl_name + '</em> where'
        var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE'

        for (var i = 0; i < rows[0].length; i++) {
            var random = getRandomInt(0, 1)
            var operators = {
                name: ['greater or equal', 'below or equal'],
                operator: ['>=', '<=']
            }

            if (i > 0) {
                Q = Q + ', and'
                A = A + ' AND'
            }

            Q = Q + ' <em>' + col_name + '</em> is ' + operators.name[random] + ' to "' + rows[0][i] + '"'
            A = A + ' ' + col_name + ' ' + operators.operator[random] + ' "' + rows[0][i] + '"'
        }

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-5", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 6: Introducing OR in where clause
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` >= value or `col_name_2` <= value2
 **/
function Question6() {
    var cache = Cookies.get('Question-6')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		var info = getTypeColumn(undefined, 1)
		
		var tbl_name = info.tbl_name
		
		var col_name = [info.col_name, getTypeColumn(undefined, 1, tbl_name).col_name]
		
        // ask to display these columns
        var named_cols = getColumns(tbl_name, 2)

        // construct the query
        var Q = 'Select the columns <em>' + named_cols.join(' and ') + '</em> from the table <em>' + tbl_name + '</em> where the value of'
        var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE'

        for (var i = 0; i < col_name.length; i++) {
            var random = getRandomInt(0, 4)
            var operators = {
                name: ['greater or equal to', 'below or equal to', 'below', 'above', 'equal to'],
                operator: ['>=', '<=', '<', '>', '=']
            }

            // returns two values from different columns for the same row
            var rows = getRows(tbl_name, col_name[i], 1)

            if (i > 0) {
                Q = Q + ', or'
                A = A + ' or'
            }

            Q = Q + ' <em>' + col_name[i] + '</em> is ' + operators.name[random] + ' "' + rows[0] + '"'
            A = A + ' ' + col_name[i] + ' ' + operators.operator[random] + ' "' + rows[0] + '"'
        }

        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-6", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 7: Introducing IN
 * Sample: SELECT `col_name` FROM `tbl_name` WHERE `col_name` IN(value, value2)
 **/
function Question7() {
    var cache = Cookies.get('Question-7')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get the data from these columns
        var info = getTypeColumn('INTEGER', 1)

        var tbl_name = info.tbl_name
        var col_name = info.col_name

        // ask to display these columns
        var named_cols = getColumns(tbl_name, 2)

        // generate random numbers
        var randomOp = getRandomInt(0, 1),
            randomSel = getRandomInt(0, 1),
            random_row_num = getRandomInt(4, 6)

        var rows = getRows(tbl_name, col_name, random_row_num, false) // strict
		var uniqueRows = [].concat.apply([], rows);

		uniqueRows = uniqueRows.filter(function(item, pos) {
			return uniqueRows.indexOf(item) == pos
		})
		
        // randomise the columns selected and the where operator!
        var selectVariance = {
            Q: ['everything', named_cols.join(', ')],
            A: ['*', '`' + named_cols.join('`, `') + '`']
        }

        var Q = 'Select <em>' + selectVariance.Q[randomSel] + '</em> from the table <em>' + tbl_name + '</em> where the value of <em>' + col_name + '</em> is either: <em>' + rows.join(', or ') + '</em>. Using IN operator'
        var A = 'SELECT ' + selectVariance.A[randomSel] + ' FROM `' + tbl_name + '` WHERE `' + col_name + '` IN("' + rows.join('", "') + '")'
        var I = ['IN']
        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-7", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 8: Introducing Distinct
 * Sample: SELECT DISTINCT `col_name`, `col_name_2` FROM `tbl_name`
 **/
function Question8() {
    var cache = Cookies.get('Question-8')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)
        // get the data from these columns
        var col_name = getColumns(tbl_name, 1)

        var Q = 'Select the DISTINCT values from the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em>'
        var A = 'SELECT DISTINCT ' + col_name + ' FROM `' + tbl_name + '`'
        var I = ['DISTINCT']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-8", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 9: Introducing Order by ... ASC / DESC
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` ORDER BY `col` ASC/DESC
 **/
function Question9() {
    var cache = Cookies.get('Question-9')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        // generate random numbers
        var randomCol = getRandomInt(1, 3),
            randomOrderBy = getRandomInt(0, 1)

        var orderBy = {
            Q: ['in ascending order', 'in descending order'],
            A: ['ASC', 'DESC']
        }

        // select from these columns
        var named_col = getColumns(tbl_name, randomCol, false)
        // order by col_name
        var order_col = getColumns(tbl_name, 1)

        var Q = 'Select <em>' + named_col.join(', ') + '</em> from the table <em>' + tbl_name + '</em> ordering them by the column <em>' + order_col + '</em>, ' + orderBy.Q[randomOrderBy]
        var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` ORDER BY `' + order_col + '` ' + orderBy.A[randomOrderBy]
        var I = ['ORDER', 'BY', orderBy.A[randomOrderBy]]

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-9", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 10: Introducing LIMIT
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` LIMIT x
 **/
function Question10() {
    var cache = Cookies.get('Question-10')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        // generate random numbers
        var randomCol = getRandomInt(1, 3),
            randomLimit = getRandomInt(5, 15)

        // select from these columns
        var named_col = getColumns(tbl_name, randomCol, false)

        var Q = 'Select ' + randomLimit + ' rows from the table <em>' + tbl_name + '</em>, displaying the columns <em>' + named_col.join(', and ') + '</em>'
        var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` LIMIT ' + randomLimit
        var I = ['LIMIT']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-10", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 11: Introducing LIMIT offset
 * Sample: SELECT `col_name`, `col_name_2` FROM `tbl_name` LIMIT x, y
 **/
function Question11() {
    var cache = Cookies.get('Question-11')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        // generate random numbers
        var randomCol = getRandomInt(1, 3),
            randomLimit = getRandomInt(5, 15),
            randomOffset = getRandomInt(5, 10)

        // select from these columns
        var named_col = getColumns(tbl_name, randomCol, false)

        var Q = 'Select ' + randomLimit + ' rows starting at the row ' + randomOffset + ' (OFFSET ' + (randomOffset - 1) + '), from the table <em>' + tbl_name + '</em>, displaying the columns <em>' + named_col.join(', and ') + '</em>'
        var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + tbl_name + '` LIMIT ' + (randomOffset - 1) + ', ' + randomLimit
        var I = ['LIMIT']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-11", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 12: Introducing Count
 * Sample: SELECT Count(`col_name`), `col_name_2` FROM `tbl_name`
 **/
function Question12() {
    var cache = Cookies.get('Question-12')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        // get the column to count, not strict but tables usually have 2+ cols, right?
        var col_name = getColumns(tbl_name, 1)

        var Q = 'Select the number of rows from the table ' + tbl_name + ', using the COUNT function'
        var A = 'SELECT COUNT(*) FROM `' + tbl_name + '`'
        var I = ['COUNT']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-12", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 13: Using Count and the Where clause
 * Sample: SELECT Count(`col_name`), `col_name_2` FROM `tbl_name` WHERE `col_name` <=> val
 **/
function Question13() {
    var cache = Cookies.get('Question-13')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		var info = getTypeColumn(undefined, 1)
		
		var tbl_name = info.tbl_name
		var col_name = info.col_name

        // generate randoms 
        var randomOp = getRandomInt(0, 3)

        // available operators
        var row = getRows(tbl_name, col_name, 1)
        var operators = {
            Q: ['above or equal to', 'below or equal to', 'above', 'below'],
            A: ['>=', '<=', '>', '<']
        }

        var Q = 'Select the number of rows from the table ' + tbl_name + ' where the value of ' + col_name + ' is ' + operators.Q[randomOp] + ' "' + row + '"'
        var A = 'SELECT COUNT(*) FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + operators.A[randomOp] + ' "' + row + '"'
        var I = ['COUNT', 'WHERE']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-13", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 14: Introducing MAX, MIN, AVG
 * Sample: SELECT MIN(`col_name`), MAX(`col_name_2`) FROM `tbl_name`
 **/
function Question14() {
    var cache = Cookies.get('Question-14')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        var tbl_name = getTables(1)

        // get the column in where
        var col_name = getColumns(tbl_name, 3)

        var Q = 'Select the '
        var A = 'SELECT '

        // available functions
        var functions = {
            Q: ['maximum', 'minimum', 'average'],
            A: ['MAX', 'MIN', 'AVG']
        }
        for (var i = 0; i < col_name.length; i++) {

            if (i == 1) {
                Q = Q + ', '
                A = A + ', '
            } else if (i == 2) {
                Q = Q + ' and '
                A = A + ', '
            }

            Q = Q + functions.Q[i] + ' value of the column <em>' + col_name[i] + '</em>'
            A = A + functions.A[i] + '(' + col_name[i] + ')'
        }

        Q = Q + ' from the table <em>' + tbl_name + '</em>'
        A = A + ' FROM `' + tbl_name + '`'

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-14", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 15: Introducing Group By
 * Sample: SELECT MIN(`col_name`) FROM `tbl_name` Group by `col_name`
 **/
function Question15() {
    var cache = Cookies.get('Question-15')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // generate randoms 
        var randomFunc = getRandomInt(0, 2)

        // get the column in where
        var info = getTypeColumn('INTEGER')

        var tbl_name = info.tbl_name
        var col_name = info.col_name

        // get the group by column
        var group_col = getColumns(tbl_name, 1)

        // available functions
        var functions = {
            Q: ['maximum', 'minimum', 'average'],
            A: ['MAX', 'MIN', 'AVG']
        }

        Q = 'Select the ' + functions.Q[randomFunc] + ' value of the column <em>' + col_name + '</em> from the table <em>' + tbl_name + '</em> grouping the results by the column <em>' + group_col + '</em>'
        A = 'SELECT ' + functions.A[randomFunc] + '(' + col_name + ') FROM `' + tbl_name + '` GROUP BY `' + group_col + '`'
        var I = [functions.A[randomFunc], 'GROUP', 'BY']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-15", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 16: Introducing Nested Queries
 * Sample: SELECT * FROM `tbl_name` WHERE `col_name` > (SELECT AVG(`col_value`) FROM `tbl_name`)
 **/
function Question16() {
    var cache = Cookies.get('Question-16')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get a column that is only fill with INT's. 
        // 				{tbl_name: x, col_name: y}
        var info = getTypeColumn('INTEGER')

        // generate randoms 
        var randomCol = getRandomInt(1, 2),
            randomOp = getRandomInt(0, 3)

        var named_col = getColumns(info.tbl_name, randomCol)

        var operators = {
            Q: ['greater or equal to', 'below or equal to', 'below', 'above'],
            A: ['>=', '<=', '<', '>']
        }

        var Q = 'Select the rows from <em>' + named_col.join(', ') + '</em> in <em>' + info.tbl_name + '</em> where the value of <em>' + info.col_name + '</em> is ' + operators.Q[randomOp] + ' the average of the column <em>' + info.col_name + '</em>'
        var A = 'SELECT `' + named_col.join('`, `') + '` FROM `' + info.tbl_name + '` WHERE `' + info.col_name + '` ' + operators.A[randomOp] + ' (SELECT AVG(`' + info.col_name + '`) FROM `' + info.tbl_name + '`)'
        var I = ['SELECT', 'SELECT']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-16", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 17: Introducing ISNULL, ISNOT
 * Sample: SELECT * FROM `tbl_name` WHERE `col_name` IS NULL/IS NOT NULL
 **/
function Question17() {
    var cache = Cookies.get('Question-17')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
		
		var info = getTypeColumn(undefined, 0)
		
		var tbl_name = info.tbl_name
		var col_name = info.col_name

        // generate randoms 
        var randomCols = getRandomInt(1, 2),
            randomNull = getRandomInt(0, 1)

        // select these
        var named_cols = getColumns(tbl_name, randomCols)

        // random null or not null
        var nulls = {
            Q: ['null values', 'not null values'],
            A: ['IS NULL', 'IS NOT NULL'],
            I: ['NULL', ['NOT', 'NULL']]
        }

        var Q = 'Select the columns <em>' + named_cols.join(', ') + '</em> from the table <em>' + tbl_name + '</em> where the rows in the <em>' + col_name + '</em> column contains only <strong>' + nulls.Q[randomNull] + '</strong> values'
        var A = 'SELECT `' + named_cols.join('`, `') + '` FROM `' + tbl_name + '` WHERE `' + col_name + '` ' + nulls.A[randomNull]
        var I = nulls.I[randomNull]

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-17", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 18: Introducing JOINS
 * Sample: SELECT a.BillingCity, a.InvoiceDate, b.SupportRepId, b.LastName FROM Invoice a INNER JOIN Customer b ON (a.CustomerId = b.CustomerId)
 **/
function Question18() {
    var cache = Cookies.get('Question-18')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get a valid foreign column
        var info = getForeign()

        // generate random
        var randomFromCols = getRandomInt(1, 2),
            randomToCols = getRandomInt(1, 2)

        // from col table 
        var col_f = getColumns(info.from.tbl_name, randomFromCols)
        // to col table 
        var col_t = getColumns(info.to.tbl_name, randomToCols)

        var Q = 'Select the columns <em>' + col_f.join(', ') + '</em> from the table <em>' + info.from.tbl_name + '</em>' +
            ', and the columns <em>' + col_t.join(', ') + '</em> from the table <em>' + info.to.tbl_name + '</em>' +
            ' joining ' + info.from.tbl_name + ' to ' + info.to.tbl_name + ' with an <strong>inner join</strong>, joining the columns <em>' + info.from.tbl_name + '.' + info.from.col_name + '</em>' +
            ' and the column <em>' + info.to.tbl_name + '.' + info.to.col_name + '</em>'

        var A = 'SELECT a.' + col_f.join(', a.') + ', b.' + col_t.join(', b.') + ' FROM ' + info.from.tbl_name + ' a INNER JOIN ' + info.to.tbl_name + ' b ON (a.' + info.from.col_name + ' = b.' + info.to.col_name + ')'

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: ['INNER', 'JOIN']
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-18", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 19: Introducing JOINS
 * Sample:SELECT a.BillingCity, a.InvoiceDate, b.SupportRepId, b.LastName 
 *				FROM Invoice a 
 * 				LEFT JOIN Customer b 
 *				ON (a.CustomerId = b.CustomerId)
 **/
function Question19() {
    var cache = Cookies.get('Question-19')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get a valid column that is a foreign key
        var info = getForeign()

        // generate random numbers
        var randomFromCols = getRandomInt(1, 2),
            randomToCols = getRandomInt(1, 2)

        // get columns from the "from" table to select
        var colFrom = getColumns(info.from.tbl_name, randomFromCols)
        // get columns from the "joined" table to select
        var colTo = getColumns(info.to.tbl_name, randomToCols)

        // create the variable that will hold the question string
        var Q = 'Select the columns <em>' + colFrom.join(', ') + '</em> from the table <em>' + info.from.tbl_name + '</em>' +
            ', and the columns <em>' + colTo.join(', ') + '</em> from the table <em>' + info.to.tbl_name + '</em>' +
            ' joining ' + info.from.tbl_name + ' to ' + info.to.tbl_name + ' using a <strong>left join</strong>, ' +
            'joining the columns <em>' + info.from.tbl_name + '.' + info.from.col_name + '</em>' +
            ' and the column <em>' + info.to.tbl_name + '.' + info.to.col_name + '</em>'

        // create the variable that will hold the model answer
        var A = 'SELECT a.' + colFrom.join(', a.') + ', b.' + colTo.join(', b.') + ' FROM ' +
            info.from.tbl_name + ' a LEFT JOIN ' + info.to.tbl_name +
            ' b ON (a.' + info.from.col_name + ' = b.' + info.to.col_name + ')'

        // array of keywords that need to be present in the user's query
        var I = ['LEFT', 'JOIN']

        //generate the object that will be returned as well as saved in the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: ['LEFT', 'JOIN']
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-19", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 20: Introducing table aliases
 * Sample: SELECT `col` FROM `table` AS tbl
 **/
function Question20() {
    var cache = Cookies.get('Question-20')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get a valid foreign column
        var tbl_name = getTables(1)

        // get a suitable alias (first two letters of table name seems okay) 
        var tbl_alias = tbl_name[0][0].substr(0, 1)

        // generate random
        var randomCols = getRandomInt(1, 2)

        // cols to select table 
        var col_name = getColumns(tbl_name, randomCols)

        var Q = 'Select the columns <em>' + col_name.join(', ') + '</em> from the table <em>' + tbl_name + '</em>. Using the table alias <em>' + tbl_alias + '</em>'
        var A = 'SELECT `' + col_name.join('`, `') + '` FROM ' + tbl_name + ' AS ' + tbl_alias
        var I = ['AS', tbl_alias.toUpperCase()]
        
		//set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-20", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 21: Introducing column aliases
 * Sample: SELECT `col` AS a FROM `table`
 **/
function Question21() {
    var cache = Cookies.get('Question-21')

    //check if we have a stored version already saved? if not make one...
    if (typeof cache === 'undefined') {
        // get a valid foreign column
        var tbl_name = getTables(1)

        // cols to select table
        var col_name = getColumns(tbl_name, 1)
        var col_alias = col_name[0].substr(0, 1)

        var Q = 'Select the columns <em>' + col_name + '</em> with the alias <em>' + col_alias + '</em> from the table <em>' + tbl_name + '</em>'
        var A = 'SELECT ' + col_name + ' AS ' + col_alias + ' FROM ' + tbl_name

        //set the cache
        cache = {
            Question: Q,
            Answer: A
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-21", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/**
 * Question 22: Introducing LIKE
 * Sample: SELECT `col` FROM `table` WHERE `col` LIKE '%ABC'
 **/
function Question22() {
    var cache = Cookies.get('Question-22')

    //check if we have a stored version already saved? if not make one...
    if(typeof cache === 'undefined') {
        // get a valid text column
        var info = getTypeColumn('VARCHAR') 

        // get a random row value
        var row = getRows(info.tbl_name, info.col_name, 1).toString()

        // split the sentance if it is and return a random segement
        var split = row.split(' ')
        // shuffle it
        split = shuffle(split)

        // length of split word
        var row_length = split[0].length

        // generate randoms
        var before = getRandomInt(0, 1),
            // row_length -1 is the max it can be
            random_start = getRandomInt(1, Math.max(1, (row_length - 2)))

        // (row_length - random_start) is the full string
        var partial = row.substr(random_start, getRandomInt(2, (row_length - random_start)))

        var Q = 'Select all the rows from the table <em>' + info.tbl_name + '</em> where the column <em>' + info.col_name + '</em> contains "<em>' + partial + '</em>" anywhere in the row value'
        var A = 'SELECT * FROM `' + info.tbl_name + '` WHERE `' + info.col_name + '` LIKE "%' + partial + '%"'
        var I = ['LIKE']

        //set the cache
        cache = {
            Question: Q,
            Answer: A,
            Include: I
        }

        // Encode the String
        var encodedString = Base64.encode(JSON.stringify(cache))
        Cookies.set("Question-22", encodedString)
    } else {
        cache = JSON.parse(Base64.decode(cache))
    }
    return cache.Question
}

/* Check the answer
 * @param {json} inputResult - the user input containing their sql output in json.stringify!
 * @param {string} raw - the raw SQL that the user inputted
 * @return {bool} - correct or not?
 */
function checkAnswer(inputResult, raw) {
    // refresh the current question from cookie
    var currQuestion =
        (typeof Cookies.get('CurrQuestion') !== 'undefined') ? Cookies.get('CurrQuestion') : 1
    // fetch the model answer from the cache (generated when a question was stored)
    var cache = Cookies.get('Question-' + currQuestion)
    // if the answer isn't in the cache, return error
    if (typeof cache === 'undefined') {
        return 'An error occurred while fetching the answer from the cache!';
    }

    // decode the cookie
    cache = Base64.decode(cache)
    // parse the string into a JSON object
    cache = JSON.parse(cache)

    // Check to make sure syntax includes certain keywords, if set
    if (typeof cache.Include !== 'undefined') {
        var keywordIndex = -1

        for (var i = 0; i < cache.Include.length; i++) {
            // search for the keyword, if strict, must come AFTER the previous keyword
            keywordIndex = raw.toUpperCase().indexOf(cache.Include[i], keywordIndex + 1)
            if (keywordIndex == -1) { // not found
                return 'Looking for the incursion of the keyword: ' +
                    cache.Include[i] + ', but not found in the correct position!'
            }
        }
    }

    // set the blank arrays
    var modelResults = [],
        userResults = []

    // prepare both queries
    var stmt = db.prepare(raw)
    var answerStmt = db.prepare(cache.Answer)

    // run the statements in steps to loop each row
    while (answerStmt.step()) modelResults.push(answerStmt.getAsObject())
    while (stmt.step()) userResults.push(stmt.getAsObject())

    // free the statements to prevent memory leaks
    stmt.free()
    answerStmt.free()

    // check both result objects are of equal length
    if (modelResults.length != userResults.length || !userResults.length) {
        return 'Expected a total of ' + modelResults.length + ' row(s) to be returned' +
            ', instead got ' + userResults.length + '!';
    }

    // extract the column names via the object keys
    var userColumns = Object.keys(userResults[0])
    var modelColumns = Object.keys(modelResults[0])

    // check if the columns selected is the same LENGTH as the model answer
    if (modelColumns.length != userColumns.length) {
        return 'Expected only the following column(s) to be selected: ' +
            modelColumns.join(', ');
    }

    // loop through each column
    for (var i = 0; i < userColumns.length; i++) {
        // construct a variable containing the row values contained in this column
        var answerObj = modelResults.map(function(item) {
            return item[userColumns[i]
                // remove any unwanted punctuation
                .replace(/[^A-Za-z()*]+/g, "")
                // and capitalize aggregate functions
                .replace(/(COUNT|SUM|AVG|MIN|TOTAL|MAX|SUM)\(/gi, l => l.toUpperCase())]
        }).filter(function(x) {
            return typeof x !== 'undefined'
        })
        // filter out the undefined values, indication of mis-matched column names

        // do the same with the user's answer
        var userObj = userResults.map(function(item) {
            return item[userColumns[i]]
        })

        // checks that the columns selected are expected
        if (answerObj.length != userObj.length) {
            return 'Expected only the following column(s) to be selected: ' +
                modelColumns.join(', ');
        }

        var lastItem;
        // checks every value in the users answer is included in the model answer
        var isPresent = answerObj.every(function(item, idx) {
            lastItem = item;
            return userObj.indexOf(item) !== -1
        })

        // if one column returns false, stop checking and return feedback
        if (!isPresent) {
            return 'The row containing "' + lastItem + '" in the column ' +
                userColumns[i] + ' wasn\'t found within your result set';
        }
    }
    // if the code executed to this point, the solution is valid
    return true
} 