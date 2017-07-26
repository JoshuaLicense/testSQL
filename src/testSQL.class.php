<?php
declare(strict_types=1);

use Firebase\JWT as JWT;

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

/**
 * Class for testSQL
 *
 * PHP version 7
 *
 * @author   Joshua License <Joshua.License@gmail.com>
 * @license  https://opensource.org/licenses/MIT
 * @link     https://github.com/JoshuaLicense/testSQL
 */

class testSQL
{
  /**
   * The database instance
   */
  protected $db = NULL;

  /**
   * Array of the settings stored in the .ini configuration file
   */
  protected $settings = [];

  /**
   * HTTP status codes that are used
   */
  public static $http_codes = array(
    'OK' => 200,            // standard response for successsful request
    'NO_CONTENT' => 204,    // success but returning no content
    'BAD_REQUEST' => 400,   // client error (resource not set)
    'UNAUTHORIZED' => 401,  // authentication failed
    'FORBIDDEN' => 403,     // understood the request, but not fulfilling it
    'NOT_FOUND' => 404,     // resource not found
    'CONFLICT' => 409,      // conflict e.g. Username taken
    'SERVER_ERROR' => 500,  // unexpected error
  );

  /**
   * Constructor function for the class
   *
   * @param database object    $connection   the database connection variable
   *
   */
  public function __construct(database $connection, string $settings_path = '../config/server_settings.ini') {
    $this->db = $connection;

    if(file_exists($settings_path)) {
      $this->settings = parse_ini_file($settings_path, true);
    } else {
      throw new Exception('Settings path invalid!');
    }
  }

  /**
   * Is the feature active
   *
   * @param   string    $feature   the feature name
   *
   * @return  bool     returns true if enabled OR the feature is unrecognised
   *                   false otherwise
   */
  public function isActiveFeature(string $feature) : bool {
    // if no settings are loaded assume everything is enabled
    if(!$this->settings) return true;

    if(array_key_exists($feature, $this->settings['features_enabled']) &&
      !$this->settings['features_enabled'][$feature]) {
        return false;
    }
    return true;
  }

  /**
   * Get all the saved databases associated with the user
   *
   * @return {json} - list of database information associated to the user
   */
  public function getAllDatabases() {
    if(!$this->isActiveFeature('login')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if(!$token = $this->getJWT()) {
      self::response('You need to be logged in to access this feature!', self::$http_codes['UNAUTHORIZED']);
    }

    $stmt = $this->db->prepare('SELECT `ID`, `Created` FROM `Stored_Database` WHERE `User_ID` = :user_id');
    $stmt->execute(array(':user_id' => $token['user_id']));
    $databases = $stmt->fetchAll();

    self::response(json_encode($databases), self::$http_codes['OK']);
  }

  /**
   * Save a database file to the database
   *
   * @param string    $db_path     the path to the database
   *
   */
  public function saveDatabase(string $db_path = 'php://input') {
    if(!$this->isActiveFeature('login')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if(!$token = $this->getJWT()) {
      self::response('You need to be logged in to access this feature!', self::$http_codes['UNAUTHORIZED']);
    }

    // if the file is a stream, file_exists doesn't work
    // supress the error from file_get_contents when path doesn't exists
    $db_file = @file_get_contents($db_path);

    if($db_file === false) {
      self::response('Cannot find file!', self::$http_codes['BAD_REQUEST']);
    }

    $stmt = $this->db->prepare('SELECT COUNT(`ID`) as count FROM `Stored_Database` WHERE `User_ID` = :user_id');
    $stmt->execute(array(':user_id' => $token['user_id']));
    $database = $stmt->fetch();

    if($database['count'] >= $this->settings['defines']['stored_database_limit']) {
      self::response('You have reached the limit for the amount of stored databases!', self::$http_codes['FORBIDDEN']);
    }

    $stmt = $this->db->prepare('INSERT INTO `Stored_Database` (`User_ID`, `File`) VALUES (:user_id, :file)');
    $stmt->execute(array(':user_id' => $token['user_id'], ':file' => $db_file));

    if($stmt->rowCount() === 1) {
      self::response('Database saved to the database', self::$http_codes['OK']);
    }
    self::response('Database couldn\'t be saved', self::$http_codes['SERVER_ERROR']);
  }

  /**
   * Load a database file from the database
   *
   * @param int    $db_id     the id of the database
   *
   * @return string   return the raw database to the client
   */
  public function loadDatabase(int $db_id) {
    if(!$this->isActiveFeature('login')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if(!$token = $this->getJWT()) {
      self::response('You need to be logged in to access this feature!', self::$http_codes['UNAUTHORIZED']);
    }

    $stmt = $this->db->prepare('SELECT `File` FROM `Stored_Database` WHERE `ID` = :db_id && `User_ID` = :user_id');
    $stmt->execute(array(':db_id' => $db_id,':user_id' => $token['user_id']));
    $database = $stmt->fetch();

    if($database) {
      header('Content-Type: image/png');
      header('Content-Length: ' . strlen($database['File']));

      self::response($database['File'], self::$http_codes['OK']);
    }
    self::response('Database not found!', self::$http_codes['NOT FOUND']);
  }

  /**
   * Delete a database file from the database
   *
   * @param int    $db_id     the id of the database
   */
  public function deleteDatabase(int $db_id) {
    if(!$this->isActiveFeature('login')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if(!$token = $this->getJWT()) {
      self::response('You need to be logged in to access this feature!', self::$http_codes['UNAUTHORIZED']);
    }

    $stmt = $this->db->prepare('SELECT `ID` FROM `Stored_Database` WHERE `ID` = :db_id && `User_ID` >= :user_id');
    $stmt->execute(array(':db_id' => $db_id,':user_id' => $token['user_id']));
    $database = $stmt->fetch();

    if($database) {
      $this->db->exec('DELETE FROM `Stored_Database` WHERE `ID` = ' . $database['ID']);

      self::response('Database successfully deleted', self::$http_codes['OK']);
    }
    self::response('Database not found!', self::$http_codes['NOT FOUND']);
  }

  /**
   * Login a user
   *
   * @param string    $username
   * @param string    $password
   *
   * @return a relevant response and http code is sent to the client
   */
  public function login(string $username, string $password) {
    if(!$this->isActiveFeature('login')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if($this->isLoggedIn()) {
      self::response('Already logged in!', self::$http_codes['OK']);
    }

    $stmt = $this->db->prepare('SELECT `ID`, `Username`, `Password` FROM `User` WHERE `Username` = :username');
    $stmt->execute(array(':username' => $username));
    $user = $stmt->fetch();

    if($user) {
      // verify the user's password
      if(password_verify($password, $user['Password'])) {
        /**
         * Make the JWT
         * The private key will be extracted from the settings
         */
        $key = $this->settings['jwt']['key'];
        $token = array(
          'exp' => time() + $this->settings['jwt']['expire'],
          'user_id' => $user['ID'],
          'username' => $user['Username'],
        );

        if($this->setJWT($token, $key)) {
          self::response('Logged in successfully', self::$http_codes['OK']);
        }
        self::response('Problem setting JWT cookie', self::$http_codes['SERVER_ERROR']);
      }
    }
    self::response('Username or password is incorrect', self::$http_codes['UNAUTHORIZED']);
  }

  /**
   * Signup a user
   *
   * @param string    $email
   * @param string    $username
   * @param string    $password
   *
   * @return a relevant response and http code is sent to the client
   */
  public function signup(string $email, string $username, string $password) {
    if(!$this->isActiveFeature('register')) {
      self::response('The login feature is not active!', self::$http_codes['FORBIDDEN']);
    }

    if($this->isLoggedIn()) {
      self::response('Already logged in!', self::$http_codes['UNAUTHORIZED']);
    }

    $stmt = $db->prepare('SELECT `Email` FROM `User` WHERE `Username` = :username OR `Email` = :email');
    $stmt->execute(array(':username' => $username, ':email' => $email));
    $existingUser = $stmt->fetch();

    if($existingUser) {
      self::response($existingUser['Email'] == $email ? 'email-taken' : 'username-taken', self::$http_codes['CONFLICT']);
    }

    $encryptedPassword = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare('INSERT INTO `User` (`Email`, `Username`, `Password`) VALUES (:email, :username, :encryptedPassword)');
    $stmt->execute(array(':email' => $email, ':username' => $username, ':encryptedPassword' => $encryptedPassword));

    if($stmt->rowCount() === 1) {
      /**
       * Make the JWT
       * The private key will be extracted from the settings
       */
      $key = $this->settings['jwt']['key'];
      $token = array(
        'exp' => time() + $this->settings['jwt']['expire'],
        'user_id' => $db->lastInsertId(),
        'username' => $username,
      );

      if($this->setJWT($token, $key)) {
        self::response('Signed up successfully', self::$http_codes['OK']);
      }
    }
    self::response('Failed to create user', self::$http_codes['SERVER_ERROR']);
  }

  /**
   * Logs out the current user
   */
  public function logout() {
    if($this->isLoggedIn()) {
      unset($_COOKIE['UserJWT']);
      setcookie('UserJWT', '', time() - 3600);
    }
  }

  /**
   * Queries the database to return information regarding the current session
   *
   * @param integer   $user_id   the user's primary key (ID)
   *
   * @return array    session data, blank array is returned if not found
   */
  public function getUserSession(int $user_id) : array {
    $sql = 'SELECT
              (SELECT `Username` FROM `User` WHERE `ID` = s.`OwnerUserID`) as "SessionOwner",
              us.`DateJoined`,
              s.`CreatedAt`,
              s.`DefaultDatabaseName`
            FROM `UserSession` us
            INNER JOIN `Session` s ON(us.`SessionID` = s.`ID`)
            WHERE
              us.`UserID` = "' . $user_id . '"
              AND us.`DateLeft` IS NULL';

    $stmt = $this->db->query($sql);
    $session = $stmt->fetch();

    return $session;
  }

  /**
   * Outputs a file, with the specified encoding
   *
   * @param string    $file_name   the path where the file exists
   * @param string    $encoding   the expected content type of the file
   *
   * @return string   returns the content of the file
   */
  public static function outputFile(string $file_name, string $encoding = 'text/html'): string {
    header('Content-Type: ' . $encoding);
    header('Content-Length: ' . filesize($file_name));
    readfile($file_name);
  }

  /**
   * Copies a file from one place to another
   *
   * @param string    $from_file   the path where the file exists
   * @param string    $to_file     the path where you want to copy the file too
   *
   * @return boolean  true if the file was saved, false if not
   */
  public static function copyFile(string $from_file, string $to_file): bool {
    $sqlite_file = self::getFile($from_file);
    if($sqlite_file !== false) {
        return (file_put_contents($to_file, $sqliteFile) !== false);
    }
    return false;
  }

  /**
   * Stores the JWT inside a cookie
   *
   * @param array   $token    the token array
   * @param array   $key      the encryption key
   *
   * @return boolean true the cookie was stored, false if not
   */
  public function setJWT(array $token, string $key): bool {
    try {
      $token['iat'] = time();

      $jwt = JWT::encode($token, $key);
    }
    catch (Exception $e) {
      self::response('Error constructing the JSON web token!', self::$http_codes['SERVER_ERROR']);
    }

    return setcookie('UserJWT', $jwt, strtotime('+1 day'), '/');
  }

  /**
   * Check if the user logged in
   *
   * @return mixed  jwt token if logged in, false otherwise
   */
  public function getJWT() {
    $jwtCookie = $_COOKIE['UserJWT'] ?? false;

    if($jwtCookie) {
      try {
        return JWT::decode($jwtCookie, $this->settings['jwt']['key']);
      }
      catch(Firebase\ExpiredException $e) {
        // token expired BUT it's still valid so renew it
        JWT::$leeway = 720000;
        $token = (array) JWT::decode($jwtCookie, $this->settings['jwt']['key']);
        // TODO: test if token is blacklisted
        $token['exp'] = time() + $this->settings['jwt']['expire'];

        if($this->setJWT($token, $this->settings['jwt']['key'])) {
          return $token;
        }
      }
      catch (Exception $e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Check if the user logged in
   *
   * @return bool
   */
  public function isLoggedIn() : bool {
    return !($this->getJWT() === false);
  }

  /**
   * Outputs a json response, with http code, and terminates script
   *
   * @param string    $response    the response from the calling function, describing the http code
   * @param int       $code        http code
   */
  public static function response(string $response, int $code) : string {
    http_response_code($code);
    exit($response);
  }
}

?>
