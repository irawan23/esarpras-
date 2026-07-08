<?php
// php_version/config.php
$host = 'localhost';
$user = 'root'; // Sesuaikan dengan user MySQL XAMPP/Hosting
$pass = '';     // Sesuaikan dengan password MySQL XAMPP/Hosting
$db   = 'simsarpras';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi Gagal: " . $conn->connect_error);
}

session_start();
?>
