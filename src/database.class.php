<?php

/**
 * Database connection for testSQL
 *
 * PHP version 7
 *
 *
 * @author   Joshua License <Joshua.License@gmail.com>
 * @license  https://opensource.org/licenses/MIT
 * @link     https://github.com/JoshuaLicense/testSQL
 */

class database extends PDO
{
  public function __construct($file = '../config/server_settings.ini')
  {
    if (!$settings = parse_ini_file($file, TRUE)) throw new exception('Unable to open ' . $file . '.');

    $dns = $settings['database']['driver'] .
          ':host=' . $settings['database']['host'] .
          ((!empty($settings['database']['port'])) ? (';port=' . $settings['database']['port']) : '') .
          ';dbname=' . $settings['database']['dbname'];

    parent::__construct(
      $dns,
      $settings['database']['username'],
      $settings['database']['password'],
      array(
        PDO::ATTR_ERRMODE => ($settings['debug'] ? PDO::ERRMODE_WARNING : PDO::ERRMODE_SILENT),
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
      )
    );
  }
}
?>
