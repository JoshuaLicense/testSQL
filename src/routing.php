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
?>
