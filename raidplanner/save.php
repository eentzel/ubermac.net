<?php
require_once('config.php');

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
  header('HTTP/1.1 405 Method Not Allowed');
  header('Allow: POST');
  exit();
}

function cleanup_input($str) {
  $str = preg_replace('/[^a-zA-Z0-9 \(\)\.\-\,]/', '', $str);
  $str = substr($str, 0, 40);
  return $str;
}

$data = array();
for ($i = 0; $i < 40; $i++) {
  $data[$i]['name'] = cleanup_input($_POST['player'][$i]['name']);
  $data[$i]['class'] = cleanup_input($_POST['player'][$i]['class']);
}

$db = new mysqli($db_host, $db_username, $db_password, $db_name);
if (mysqli_connect_errno()) {
    printf("Connect failed: %s\n", mysqli_connect_error());
    exit();
}
$statement = $db->prepare('INSERT INTO raid (players) VALUES (?)');
$statement->bind_param('s', serialize($data));
$statement->execute();
$id = $statement->insert_id;
$statement->close();
$db->close();

/* Send the id of the new object and (implicitly) a 200 status code.
 * The semantically correct way to do this is probably to send a
 * 201 status code, and a Location: header & body containing the full
 * URI of the new resource, e.g.: http://www.ubermac.net/raidplanner/31
 */
echo($id);

?>
