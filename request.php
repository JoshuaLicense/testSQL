<?php

if(isset($_GET['action'])) {
  if($_GET['action'] == 'login') {
    echo json_encode(array('relativePath' => 'Chinook_Sqlite.db'));
  }

  if($_GET['action'] == 'register') {
    echo json_encode(array('sessionKey' => 123));
  }
  if($_GET['action'] == 'load') {
    echo json_encode(array('relativePath' => 'Chinook_Sqlite.db'));
  }
}

?>
