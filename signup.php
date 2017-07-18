<?php
declare(strict_types=1);

namespace testSQL;
use testSQL;
use Firebase\JWT\JWT as JWT;
use PDO;

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

define('HTTP_CODE', array(
  'OK' => 200,
  'BAD_REQUEST' => 400,
  'UNAUTHORIZED' => 401,
  'NOT_FOUND' => 404,
  'CONFLICT' => 409,
  'SERVER_ERROR' => 500,
));

$email = $_GET['email'] ?? $_POST['email'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
// filter_var instead of filter_input as it will always be set
if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  exit(http_response_code(HTTP_CODE['UNAUTHORIZED']));
}

$username = $_GET['username'] ?? $_POST['username'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
// contains only letters and numbers _ - and between 8 & 20 characters
if(!preg_match('/^[A-Za-z0-9-_]{8,20}$/', $username)) {
  exit(http_response_code(HTTP_CODE['UNAUTHORIZED']));
}

$password = $_GET['password'] ?? $_POST['password'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
// Why \w instead of same as above regex? \w allows extra characters from their active locale
// QUESTION: it gets encryped so does it matter what character?
if(!preg_match('/^[\w]{8,20}$/', $password)) {
  exit(http_response_code(HTTP_CODE['UNAUTHORIZED']));
}

require('db.inc.php');

$db = new Database();
$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING );

// check if username / email already exists
$stmt = $db->prepare('SELECT `Email` FROM `User` WHERE `Username` = :username OR `Email` = :email');
$stmt->execute(array(':username' => $username, ':email' => $email));

$isTaken = $stmt->fetch(PDO::FETCH_ASSOC);
if($isTaken) {
  echo $isTaken['Email'] == $email ? 'email' : 'username';
  exit(http_response_code(HTTP_CODE['CONFLICT']));
}

// lets create the user then
$encryptedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare('INSERT INTO `User` (`Email`, `Username`, `Password`) VALUES (:email, :username, :encryptedPassword)');
$stmt->execute(array(':email' => $email, ':username' => $username, ':encryptedPassword' => $encryptedPassword));

if($stmt->rowCount() === 1) {
  // created successful, login the user
  // create the web token
  require('lib/JWT/JWT.php');

  $key = $encryptedPassword;
  $token = array(
      'exp' => time() + 900, // expires after 15 minutes
      'username' => $username,
      'current_database' => false,
      'session_details' => []
  );

  try {
    $jwt = JWT::encode($token, $key);

    setcookie('user-jwt', $jwt);
  } catch (Exception $e) {
    exit(http_response_code(HTTP_CODE['SERVER_ERROR']));
  }

  // TODO: Save current database

  exit(http_response_code(HTTP_CODE['OK']));
}
exit(http_reponse_code(HTTP_CODE['SERVER_ERROR']));

?>
