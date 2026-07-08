<?php
// php_version/print_barcode.php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$id = isset($_GET['id']) ? $_GET['id'] : null;
$items = [];

if ($id) {
    $res = $conn->query("SELECT * FROM inventory_items WHERE id = $id");
    if ($res->num_rows > 0) {
        $items[] = $res->fetch_assoc();
    }
} else {
    $res = $conn->query("SELECT * FROM inventory_items WHERE status = 'aktif' LIMIT 20");
    while ($row = $res->fetch_assoc()) {
        $items[] = $row;
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cetak Barcode - SIMSARPRAS</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .label-container { display: flex; flex-wrap: wrap; gap: 20px; }
        .barcode-label { 
            border: 1px solid #ccc; 
            padding: 15px; 
            text-align: center; 
            width: 250px;
            border-radius: 8px;
            background: white;
        }
        .school-name { font-size: 10px; font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px; }
        .item-name { font-size: 12px; font-weight: bold; margin-top: 5px; }
        .item-info { font-size: 10px; color: #666; }
        @media print {
            .no-print { display: none; }
            body { padding: 0; }
            .barcode-label { border: 1px solid #eee; break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; padding: 15px; background: #f0f0f0; border-radius: 8px;">
        <h3>Opsi Cetak Barcode</h3>
        <?php if (empty($items)): ?>
            <p style="color: red;">Data barang tidak ditemukan. Pastikan Anda sudah mengisi data inventaris dengan status 'aktif'.</p>
        <?php else: ?>
            <p>Gunakan kertas stiker label untuk hasil terbaik. Klik tombol cetak di bawah atau tekan Ctrl+P.</p>
            <button onclick="window.print()" style="padding: 10px 20px; background: #212529; color: white; border: none; border-radius: 5px; cursor: pointer;">Cetak Sekarang</button>
        <?php endif; ?>
        <a href="index.php" style="margin-left: 10px; color: #666; text-decoration: none;">Kembali ke Dashboard</a>
    </div>

    <div class="label-container">
        <?php if (empty($items)): ?>
            <div style="text-align: center; width: 100%; padding: 50px; color: #999;">
                Tidak ada barcode untuk dicetak.
            </div>
        <?php endif; ?>
        <?php foreach ($items as $item): ?>
            <div class="barcode-label">
                <div class="school-name">PROPERTI SMK NEGERI CONTOH</div>
                <svg class="barcode" 
                    jsbarcode-value="<?php echo $item['barcode']; ?>"
                    jsbarcode-width="1.5"
                    jsbarcode-height="40"
                    jsbarcode-fontSize="12">
                </svg>
                <div class="item-name"><?php echo strtoupper($item['name']); ?></div>
                <div class="item-info"><?php echo $item['brand']; ?> | Thn: <?php echo $item['year_acquired']; ?></div>
            </div>
        <?php endforeach; ?>
    </div>

    <script>
        JsBarcode(".barcode").init();
    </script>
</body>
</html>
