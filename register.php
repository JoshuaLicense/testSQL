<?php 
declare(strict_types=1);

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

define('HTTP_CODE', array(
  'OK' => 200,
  'BAD_REQUEST' => 400,
  'UNAUTHORIZED' => 401,
  'NOT_FOUND' => 404,
));

$username = $_GET['username'] ?? $_POST['username'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
$password = $_GET['password'] ?? $_POST['password'] ?? exit(http_response_code(HTTP_CODE['BAD_REQUEST']));
