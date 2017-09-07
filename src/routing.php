<?php
declare(strict_types=1);

$action = $_GET['action'] ?? testSQL::response('Routing action not found', testSQL::$http_codes['BAD_REQUEST']);

spl_autoload_register(function($class_name) {
  $isVendor = strpos($class_name, '\\');

  $root = __DIR__ . DIRECTORY_SEPARATOR;
  $path = $root . ($isVendor ? 'vendor' . DIRECTORY_SEPARATOR : '');

  $path .= $class_name . '.class.php';

  include $path;
});

$db = new Database();
$testSQL = new testSQL($db);

// User management
if($action === 'login') {
  $username = $_GET['username'] ?? testSQL::response('Please enter a username!', testSQL::$http_codes['BAD_REQUEST']);
  $password = $_GET['password'] ?? testSQL::response('Please enter a password!', testSQL::$http_codes['BAD_REQUEST']);

  if(!preg_match('/^[A-Za-z0-9-_]{8,20}$/', $username)) {
    testSQL::response('Please enter a valid username!', testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[\w]{8,20}$/', $password)) {
    testSQL::response('Please enter a valid password!', testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->login($username, $password);
}

if($action === 'logout') {
  $testSQL->logout();
}

if($action === 'signup') {
  $email = $_GET['email'] ?? testSQL::response('Please enter an email!', testSQL::$http_codes['BAD_REQUEST']);
  $username = $_GET['username'] ?? testSQL::response('Please enter a username!', testSQL::$http_codes['BAD_REQUEST']);
  $password = $_GET['password'] ?? testSQL::response('Please enter a password!', testSQL::$http_codes['BAD_REQUEST']);


  if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    testSQL::response('Please enter a valid email!', testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[A-Za-z0-9-_]{8,20}$/', $username)) {
    testSQL::response('Please enter a valid username!', testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[\w]{8,20}$/', $password)) {
    testSQL::response('Please enter a valid password!', testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->signup($email, $username, $password);
}

// Session management
if($action === 'joinSession') {
  $pin = $_GET['pin'] ?? testSQL::response('Please enter a session id!', testSQL::$http_codes['BAD_REQUEST']);

  $testSQL->joinSession($pin);
}

if($action === 'getSessionProgress') {
  $testSQL->getSessionProgress();
}

if($action === 'leaveSession') {
  $testSQL->leaveSession();
}

if($action === 'getSession') {
  $session_id = $_GET['sid'] ?? testSQL::response('Please enter a session id!', testSQL::$http_codes['BAD_REQUEST']);

  $testSQL->getSession($session_id);
}

// Database management
if($action === 'getAllDatabases') {
  $testSQL->getAllDatabases();
}

if($action === 'saveDatabase') {
  // save it straight from the input buffer
  $testSQL->saveDatabase('php://input');
}

if($action === 'loadDatabase') {
  $db_id = $_GET['id'] ?? testSQL::response('Please enter a database id!', testSQL::$http_codes['BAD_REQUEST']);

  if(!ctype_digit($db_id)) {
    testSQL::response('Please enter a valid database id!', testSQL::$http_codes['BAD_REQUEST']);
  }

  $testSQL->loadDatabase((int) $db_id);
}

if($action === 'deleteDatabase') {
  $db_id = $_GET['id'] ?? testSQL::response('Please enter a database id!', testSQL::$http_codes['BAD_REQUEST']);

  if(!ctype_digit($db_id)) {
    testSQL::response('Please enter a valid database id!', testSQL::$http_codes['BAD_REQUEST']);
  }

  $testSQL->deleteDatabase((int) $db_id);
}

testSQL::response('Routing action not found!', testSQL::$http_codes['NOT_FOUND']);
?>
