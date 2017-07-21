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
?>
