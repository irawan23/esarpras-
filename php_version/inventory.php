<?php
// php_version/inventory.php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

// Handle Tambah Barang
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_item'])) {
    $barcode = $_POST['barcode'];
    $name = $_POST['name'];
    $category = $_POST['category'];
    $brand = $_POST['brand'];
    $year = $_POST['year_acquired'];
    $room_id = $_POST['room_id'];
    
    $stmt = $conn->prepare("INSERT INTO inventory_items (barcode, name, category, brand, year_acquired, room_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssii", $barcode, $name, $category, $brand, $year, $room_id);
    $stmt->execute();
}

$items = $conn->query("SELECT i.*, r.name as room_name FROM inventory_items i LEFT JOIN rooms r ON i.room_id = r.id ORDER BY i.id DESC");
$rooms = $conn->query("SELECT * FROM rooms");
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Inventaris - SIMSARPRAS</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; }
        .sidebar { height: 100vh; background: #212529; color: white; padding: 20px; position: fixed; width: 250px; }
        .main-content { margin-left: 250px; padding: 40px; }
        .card { border-radius: 15px; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-2 sidebar">
                <h4>SIMSARPRAS</h4>
                <hr>
                <ul class="nav flex-column">
                    <li class="nav-item"><a href="index.php" class="nav-link text-white">Dashboard</a></li>
                    <li class="nav-item"><a href="inventory.php" class="nav-link text-white active fw-bold">Inventaris</a></li>
                    <li class="nav-item"><a href="print_barcode.php" class="nav-link text-white">Cetak Barcode</a></li>
                    <li class="nav-item"><a href="export_pdf.php" class="nav-link text-white">Laporan PDF</a></li>
                    <li class="nav-item"><a href="ai_analyst.php" class="nav-link text-white text-warning">Analis AI</a></li>
                    <li class="nav-item"><a href="logout.php" class="nav-link text-danger">Keluar</a></li>
                </ul>
            </div>
            <div class="col-md-10 main-content">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Daftar Inventaris</h2>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addModal">Tambah Barang Baru</button>
                </div>

                <div class="card p-4">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>No</th>
                                <th>Barcode</th>
                                <th>Nama Barang</th>
                                <th>Merk</th>
                                <th>Tahun</th>
                                <th>Lokasi</th>
                                <th>Kondisi</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; while($item = $items->fetch_assoc()): ?>
                            <tr>
                                <td><?php echo $no++; ?></td>
                                <td class="font-monospace"><?php echo $item['barcode']; ?></td>
                                <td><strong><?php echo $item['name']; ?></strong></td>
                                <td><?php echo $item['brand']; ?></td>
                                <td><?php echo $item['year_acquired']; ?></td>
                                <td><?php echo $item['room_name'] ?? '-'; ?></td>
                                <td><span class="badge bg-<?php echo $item['condition_status'] == 'baik' ? 'success' : 'danger'; ?>"><?php echo strtoupper($item['condition_status']); ?></span></td>
                                <td>
                                    <a href="print_barcode.php?id=<?php echo $item['id']; ?>" class="btn btn-sm btn-outline-dark">Cetak Label</a>
                                </td>
                            </tr>
                            <?php endwhile; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Tambah -->
    <div class="modal fade" id="addModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <form method="POST">
                    <div class="modal-header">
                        <h5 class="modal-title">Tambah Barang Inventaris</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Barcode</label>
                            <input type="text" name="barcode" class="form-control" value="BRC-<?php echo time(); ?>" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Nama Barang</label>
                            <input type="text" name="name" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Kategori</label>
                            <select name="category" class="form-select">
                                <option value="umum">Umum</option>
                                <option value="tanah">Tanah</option>
                                <option value="bangunan">Bangunan</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Merk</label>
                            <input type="text" name="brand" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Tahun Perolehan</label>
                            <input type="number" name="year_acquired" class="form-control" value="<?php echo date('Y'); ?>">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Lokasi Ruang</label>
                            <select name="room_id" class="form-select">
                                <option value="">Pilih Ruang</option>
                                <?php while($room = $rooms->fetch_assoc()): ?>
                                    <option value="<?php echo $room['id']; ?>"><?php echo $room['name']; ?></option>
                                <?php endwhile; ?>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="submit" name="add_item" class="btn btn-primary">Simpan Barang</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
