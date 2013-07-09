<?php

require_once('config.php');

if ($_SERVER['REQUEST_METHOD'] != 'GET') {
  header('HTTP/1.1 405 Method Not Allowed');
  header('Allow: GET');
  exit();
}

$id = $_GET['raid_id'];
$db = new mysqli($db_host, $db_username, $db_password, $db_name);
if (mysqli_connect_errno()) {
    printf("Connect failed: %s\n", mysqli_connect_error());
    exit();
}
$statement = $db->prepare('SELECT players FROM raid WHERE id = ?');
$statement->bind_param('i', $id);
$statement->execute();
$statement->bind_result($players); // must be after execute() and before fetch()
if($statement->fetch()) {
  $raid = unserialize($players);
  $raid['id_str'] = " - $id";
  require('ui.tmpl');
}
else {
  header("HTTP/1.0 404 Not Found");
  require('notfound.html');
}
$statement->close();
$db->close();

?>
