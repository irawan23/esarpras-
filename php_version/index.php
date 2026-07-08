<?php
// php_version/index.php
require_once 'config.php';

// Cek Login
if (!isset($_SESSION['user_id'])) {
    // Sederhanakan: Jika belum login, tampilkan form login
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $u = $_POST['username'];
        $p = $_POST['password'];
        $res = $conn->query("SELECT * FROM users WHERE username='$u' AND password='$p'");
        if ($res->num_rows > 0) {
            $user = $res->fetch_assoc();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            header("Location: index.php");
        } else {
            $error = "Login Gagal!";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SIMSARPRAS PHP</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #f8f9fa; }
        .sidebar { height: 100vh; background: #212529; color: white; padding: 20px; }
        .card { border-radius: 15px; border: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <?php if (!isset($_SESSION['user_id'])): ?>
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-4 card p-4">
                    <h2 className="text-center">Login SIMSARPRAS</h2>
                    <form method="POST">
                        <input type="text" name="username" className="form-control mb-3" placeholder="Username" required>
                        <input type="password" name="password" className="form-control mb-3" placeholder="Password" required>
                        <button type="submit" className="btn btn-primary w-full">Masuk</button>
                    </form>
                </div>
            </div>
        </div>
    <?php else: ?>
        <div class="container-fluid">
            <div class="row">
                <div class="col-md-2 sidebar">
                    <h4>SIMSARPRAS</h4>
                    <hr>
                    <ul class="nav flex-column">
                        <li class="nav-item"><a href="index.php" class="nav-link text-white">Dashboard</a></li>
                        <li class="nav-item"><a href="inventory.php" class="nav-link text-white">Inventaris</a></li>
                        <li class="nav-item"><a href="print_barcode.php" class="nav-link text-white">Cetak Barcode</a></li>
                        <li class="nav-item"><a href="export_pdf.php" class="nav-link text-white">Laporan PDF</a></li>
                        <li class="nav-item"><a href="export_csv.php" class="nav-link text-white">Laporan CSV</a></li>
                        <li class="nav-item"><a href="ai_analyst.php" class="nav-link text-white text-warning">Analis AI</a></li>
                        <li class="nav-item"><a href="logout.php" class="nav-link text-danger">Keluar</a></li>
                    </ul>
                </div>
                <div class="col-md-10 p-5">
                    <h2>Dashboard</h2>
                    <div className="row mt-4">
                        <div className="col-md-3">
                            <div className="card p-4 bg-primary text-white">
                                <h5>Total Barang</h5>
                                <h3><?php echo $conn->query("SELECT COUNT(*) FROM inventory_items")->fetch_row()[0]; ?></h3>
                                <div class="d-flex gap-2">
                                    <a href="export_pdf.php" class="text-white text-decoration-none small">PDF →</a>
                                    <a href="export_csv.php" class="text-white text-decoration-none small">CSV →</a>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card p-4 bg-dark text-white">
                                <h5>Cetak Label</h5>
                                <p className="small">Generate barcode untuk semua barang aktif.</p>
                                <a href="print_barcode.php" class="btn btn-sm btn-outline-light">Buka Cetak Barcode</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php endif; ?>
</body>
</html>
