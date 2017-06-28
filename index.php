<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="favicon.ico">

    <title>TestSQL - Learn SQL Interactively</title>
    <!-- Latest compiled and minified CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">

    <!-- CodeMirror -->
    <link rel="stylesheet" href="http://codemirror.net/lib/codemirror.css" />

    <!-- jQuery UI -->
    <link rel="stylesheet" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/themes/smoothness/jquery-ui.css">

    <!-- IE10 viewport hack for Surface/desktop Windows 8 bug -->
    <link href="css/ie10-viewport-bug-workaround.css" rel="stylesheet">

    <!-- Custom style for this template -->
    <link href="css/main.css" rel="stylesheet">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
    <link rel="stylesheet" type="text/css" href="//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.0.3/cookieconsent.min.css" />
    <script src="//cdnjs.cloudflare.com/ajax/libs/cookieconsent2/3.0.3/cookieconsent.min.js"></script>
    <script>
        window.addEventListener("load", function() {
            window.cookieconsent.initialise({
                "palette": {
                    "popup": {
                        "background": "#000"
                    },
                    "button": {
                        "background": "#f1d600"
                    }
                },
                "position": "bottom-left",
                "content": {
                    "href": "https://www.cookielaw.org/cookie-compliance/"
                }
            })
        });
    </script>
</head>

<body>
    <nav class="navbar navbar-inverse navbar-fixed-top">
        <div class="container-fluid">
            <div class="navbar-header">
                <button title="Show database tables" type="button" class="navbar-toggle collapsed pull-left tables-toggle" data-toggle="collapse" data-target=".sidebar" aria-expanded="false" aria-controls="navbar">
					<span class="sr-only">Toggle database tables</span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
					<span class="icon-bar"></span>
				</button>
                <label class="navbar-toggle btn btn-default" title="Import a database">
					<span class="sr-only">Import a custom database</span>
					<i class="glyphicon glyphicon-folder-open" style="color:white"></i>
					<input type="file" class="import-SQL" style="display: none;">
				</label>
                <a class="navbar-brand" href="/"><span style="color:white;">Test</span><span style="color:#337ab7; font-weight:bold;">SQL</span></a>
            </div>
            <div id="navbar" class="collapse navbar-collapse">
                <div class="nav navbar-btn pull-right">
                    <label class="btn btn-default btn-sm">
						Import a custom database <input type="file" class="import-SQL" style="display: none;">
					</label>
                </div>
            </div>
            <!--/.nav-collapse -->
        </div>
    </nav>
    <div class="container-fluid">
        <div class="row">
            <div class="col-sm-3 col-md-2 sidebar">
                <h4 class="text-center sub-header"> Your Database </h4>
                <h5 style="font-weight:bold;"> <span class="pull-right">Records </span> Table</h5>
                <ul class="nav nav-sidebar" id="tables-SQL"></ul>
                <p class="text-center"><button type="button" class="btn btn-primary" id="restore-SQL" onclick="return confirm('Are you sure you want to restore the database to the default?');">Restore Database</button></p>
            </div>

            <div class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2 main">
                <div class="row" style="margin-bottom: 15px;">
                    <div class="input-group">
                        <div class="btn-toolbar" id="questions-SQL" role="toolbar" aria-label="Toolbar with button groups"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="panel panel-primary" style="margin-bottom: 0">
                        <div class="panel-heading"><span id="currQuestionTitle-SQL">Constructing Questions...</span></div>
                        <div class="panel-body">
                            <div id="currQuestion-SQL">Loading...</div>
                            <span class="pull-right small text-success" style="font-weight: bold; padding-top: 15px" id="status-SQL">Question Completed</span>
                        </div>
                    </div>
                </div>
                <div class="row alert alert-dismissable" style="display: none; margin-bottom: 0; margin-top: 20px;" role="alert">
                    <a href="#" class="close" data-hide="alert" aria-label="Hide feedback">&times;</a>
                    <div id="response-SQL"></div>
                </div>
                <div class="row">
                    <h2> SQL Statement </h2>
                    <div class="form-group">
                        <textarea class="form-control textarea-sql" id="textarea-sql"></textarea>
                    </div>

                    <div class="form-group">
                        <button type="button" class="btn btn-success" id="exec-SQL">Run SQL &raquo; </button>
                        <button type="button" class="btn btn-danger" id="clear-SQL">Clear</button>
                    </div>
                </div>
                <!--/row-->
                <div class="row">
                    <h2 class="sub-header"> Result </h2>
                    <div id="results-SQL">
                        <p>Click "Run SQL" to execute the SQL statement above.</p>
                        <p>The menu to the left displays the database, and will reflect any changes.</p>
                        <p>You can restore the database at any time.</p>
                    </div>
                </div>
                <!--/.row-->
            </div>
            <!--/.col-xs-12.col-sm-9-->
        </div>
        <!--/row-->
    </div>
    <!-- /.container-fluid -->

    <footer class="footer">
        <div class="container-fluid">
            <div class="col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2">
                <div class="row" style="margin: 20px 0;">
                    <span class="text-muted">&copy; 2017. Joshua License</span>
                    <div class="btn-toolbar pull-right" id="sandbox-SQL" role="toolbar" aria-label="Toolbar with button groups">
                        <div class="btn-group btn-toggle" role="group">
                            <button class="btn btn-xs btn-default disabled" style="cursor: help" title="Deviates from the questions to allow you to manipulate the database how you see fit" disabled>Sandbox Mode</button>
                            <button class="btn btn-xs btn-default">ON</button>
                            <button class="btn btn-xs btn-default">OFF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <script>
        window.jQuery || document.write('<script src="../../assets/js/vendor/jquery.min.js"><\/script>')
    </script>
    <!-- Cookie -->
    <script src="js/cookie.js"></script>
    <!-- Main script -->
    <!-- Latest compiled and minified JavaScript -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js" integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa" crossorigin="anonymous"></script>
    <!-- CodeMirror -->
    <script src="http://codemirror.net/lib/codemirror.js"></script>
    <script src="http://codemirror.net/mode/sql/sql.js"></script>
    <script type="text/javascript">
        var sqlTextarea = document.getElementById('textarea-sql');
        var editableCodeMirror = CodeMirror.fromTextArea(sqlTextarea, {
            mode: "text/x-mysql",
            lineWrapping: true,
            lineNumbers: true,
            theme: "default",
        });

        $(function() {
            $("[data-hide]").on("click", function() {
                $("." + $(this).attr("data-hide")).hide();
            })
        });
    </script>
    <script src="js/sql.js"></script>
    <script src="js/main.js"></script>
</body>

</html>