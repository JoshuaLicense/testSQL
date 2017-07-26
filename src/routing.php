<?php
declare(strict_types=1);

$action = $_GET['action'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);

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
  $username = $_GET['username'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);
  $password = $_GET['password'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);

  if(!preg_match('/^[A-Za-z0-9-_]{8,20}$/', $username)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[\w]{8,20}$/', $password)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->login($username, $password);
}

if($action === 'signup') {
  $email = $_GET['email'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);
  $username = $_GET['username'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);
  $password = $_GET['password'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);

  if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[A-Za-z0-9-_]{8,20}$/', $username)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  if(!preg_match('/^[\w]{8,20}$/', $password)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->signup($email, $username, $password);
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
  $db_id = $_GET['id'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);

  if(!ctype_digit($db_id)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->loadDatabase((int) $db_id);
}

if($action === 'deleteDatabase') {
  $db_id = $_GET['id'] ?? exit(testSQL::$http_codes['BAD_REQUEST']);

  if(!ctype_digit($db_id)) {
    exit(testSQL::$http_codes['UNAUTHORIZED']);
  }

  $testSQL->deleteDatabase((int) $db_id);
}

?>
