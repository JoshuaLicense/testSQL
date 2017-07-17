<?php
namespace testSQL;

use PDO;

class Database extends PDO
{
  public function __construct($file = 'server_settings.ini')
  {
    if (!$settings = parse_ini_file($file, TRUE)) throw new exception('Unable to open ' . $file . '.');

    $dns = $settings['database']['driver'] .
          ':host=' . $settings['database']['host'] .
          ((!empty($settings['database']['port'])) ? (';port=' . $settings['database']['port']) : '') .
          ';dbname=' . $settings['database']['dbname'];

    parent::__construct($dns, $settings['database']['username'], $settings['database']['password']);
  }
}
?>
