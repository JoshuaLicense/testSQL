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
  'SERVER_ERROR' => 500,
));

$username = $_GET['username'] ?? $_POST['username'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
$password = $_GET['password'] ?? $_POST['password'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));

require('db.inc.php');

$db = new Database();
//$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_WARNING );

$stmt = $db->prepare('SELECT `ID`, `Username`, `Password`, `DatabaseName` FROM `User` WHERE `Username` = :username');
$stmt->execute(array(':username' => $username));

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if($user) {
  if(password_verify($password, $user['Password'])) {
    // Make a JWT (JSON Web Token)
    require('lib/JWT/JWT.php');

    $key = $user['Password'];
    $token = array(
        'exp' => time() + 900, // expires after 15 minutes
        'username' => $user['Username'],
        'current_database' => $user['DatabaseName'],
        'session_details' => []
    );

    // get the user session details (if exists)
    // QUESTION: Stored procedure better?
    $sql = 'SELECT
              u.`Username` as "SessionOwner",
              u.`DatabaseName`,
              us.`DateJoined`,
              s.`CreatedAt`,
              s.`DefaultDatabaseName`
            FROM `UserSession` us
            INNER JOIN `Session` s ON(us.`SessionID` = s.`ID`)
            INNER JOIN `User` u ON(us.`UserID` = u.`ID`)
            WHERE
              s.`OwnerUserID` = "' . $user['ID'] . '"
              AND us.`DateLeft` IS NULL';

    $stmt = $db->query($sql);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if($session) {
      $token['session_details'] = $session;
    }

    try {
      $jwt = JWT::encode($token, $key);

      setcookie('user-jwt', $jwt);
    } catch (Exception $e) {
      exit(http_response_code(HTTP_CODE['SERVER_ERROR']));
    }

    if($user['DatabaseName']) {
      // QUESTION: the database name is randomly generated so is there a need to sanitize?
      $fileName = 'UserDatabase/' . $user['DatabaseName'] . '.sqlite';
      if(file_exists($fileName)) {
        header('Content-type: image/png');
        header('Content-Length: ' . filesize($fileName));
        http_response_code(HTTP_CODE['OK']);

        readfile($fileName);
        exit;
      }
    }
    http_response_code(HTTP_CODE['NOT_FOUND']);
    exit;
  }
}
http_response_code(HTTP_CODE['UNAUTHORIZED']);

?>
