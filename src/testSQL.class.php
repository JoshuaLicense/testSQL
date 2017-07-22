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
      static::response('Error constructing the JSON web token!', static::$http_codes['SERVER_ERROR']);
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
  public function isLoggedIn() {
    return !($this->getJWT() === false);
  }

  /**
   * Outputs a json response, with http code, and terminates script
   *
   * @param string    $response    the response from the calling function, describing the http code
   * @param int       $code        http code
   *
   */
  public static function response(string $response, int $code) : string {
    http_response_code($code);
    exit($response);
  }
}

?>
