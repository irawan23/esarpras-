<?php
// php_version/export_csv.php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$type = isset($_GET['type']) ? $_GET['type'] : 'inventaris';
$filename = $type . "_report_" . date('Y-m-d') . ".csv";

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=' . $filename);

$output = fopen('php://output', 'w');

if ($type == 'inventaris') {
    fputcsv($output, ['No', 'Barcode', 'Nama Barang', 'Kategori', 'Merk', 'Tahun', 'Kondisi', 'Lokasi']);
    $res = $conn->query("SELECT i.*, r.name as room_name FROM inventory_items i LEFT JOIN rooms r ON i.room_id = r.id WHERE i.status = 'aktif'");
    $no = 1;
    while($row = $res->fetch_assoc()) {
        fputcsv($output, [
            $no++,
            $row['barcode'],
            $row['name'],
            $row['category'],
            $row['brand'],
            $row['year_acquired'],
            strtoupper($row['condition_status']),
            $row['room_name'] ?? '-'
        ]);
    }
}

fclose($output);
exit;
?>
