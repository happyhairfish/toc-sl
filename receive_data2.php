<?php

$data = json_decode(file_get_contents('php://input'), true);
// print_r($data);
// echo $data["id"];
// echo $data["name"];
// echo $data["total"];

save_node($data["id"],$data["name"],$data["total"]);


function save_node($id,$name,$total) {
  // echo "hjvhk";
  // echo $id;
  // echo $name;
  // echo $total;

  $dbserver = "localhost";
  $dbuser = "root";
  $password = "root";
  $dbname = "nodes";

	// Create connection
  // $conn = mysql_connect($dbserver, $dbuser, $password);
  // echo "\n conn:";
  // echo $conn;
	$conn = new mysqli($dbserver, $dbuser, $password, $dbname);
	// Check connection
	if ($conn->connect_error) {
	    die("Connection failed: " . $conn->connect_error);
      echo "\nconn error";
	}

	// $sql = "INSERT INTO indicators (id, i1, i2) VALUES ('$id', '$i1', '$i2')";
  $sql = "INSERT INTO nodes ". "(id,name,total) ". "VALUES('$id','$name','$total')";

	if ($conn->query($sql) === TRUE) {
	    echo "New record created successfully";
	} else {
	    echo $conn->error;
	}

	$conn->close();
  // mysql_select_db('nodes');
  // $retval = mysql_query( $sql, $conn );
  //
  // if(! $retval ) {
  //   die('Could not enter data: ' . mysql_error());
  // }

  // echo "Entered data successfully\n";
  //
  // mysql_close($conn);

}

?>
