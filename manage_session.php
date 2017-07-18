<!--
  TODO : MUST BE LOGGED IN
-->

<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">

    <!-- CodeMirror -->
    <link rel="stylesheet" href="http://codemirror.net/lib/codemirror.css" />

    <!-- Site styling -->
    <link rel="stylesheet" href="css/jquery-ui.min.css"></link>
    <link rel="stylesheet" href="css/manage_session.css">
    <link rel="icon" href="favicon.ico">

    <title>Demo &#8231 testSQL</title>
  </head>
  <body>
    <div class="container-fluid bg-faded">
      <div class="row">
        <main class="col-12 pt-3 pb-5 pl-2 h-100">

        </main>
        <div class="sidebar-container p-0">
          <div class="sidebar p-0 pt-4 bg-faded">
            <h6 class="vertical">Database Schema</h6>
            <div class="list-group" id="ts-schema">
              <div class="ts-loading text-center" style="font-size:3rem;">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
            <div class="sidebar-toggler inactive py-3 px-2" title="Double click to expand/collapse">
              <div class="sidebar-toggler-text"> || </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.4/js.cookie.min.js"></script>
    <script src="js/jquery-ui.min.js"></script>
    <script src="js/jquery.ui.touch-punch.min.js"></script>
    <!-- Site scripts, sql.js first -->
    <script src="js/sql.js"></script>
    <script src="js/manage_session.js"></script>
  </body>
</html>
