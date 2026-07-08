<?php
// php_version/export_pdf.php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit;
}

$type = isset($_GET['type']) ? $_GET['type'] : 'inventaris';
$data = [];

if ($type == 'inventaris') {
    $res = $conn->query("SELECT i.*, r.name as room_name FROM inventory_items i LEFT JOIN rooms r ON i.room_id = r.id WHERE i.status = 'aktif'");
    while($row = $res->fetch_assoc()) $data[] = $row;
    $title = "LAPORAN INVENTARIS BARANG";
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Export PDF - SIMSARPRAS</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>
</head>
<body>
    <div style="text-align: center; margin-top: 100px; font-family: Arial, sans-serif;">
        <h2>Sedang Menyiapkan PDF...</h2>
        <p>Mohon tunggu sebentar, file Anda akan otomatis terunduh.</p>
        <div id="status">Memproses data...</div>
    </div>

    <script>
        const { jsPDF } = window.jspdf;
        
        function generatePDF() {
            const doc = new jsPDF();
            const data = <?php echo json_encode($data); ?>;
            const title = "<?php echo $title; ?>";
            
            // Header
            doc.setFontSize(18);
            doc.text("SMK NEGERI CONTOH JAKARTA", 105, 15, { align: 'center' });
            doc.setFontSize(12);
            doc.text(title, 105, 25, { align: 'center' });
            doc.text("Periode: " + new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }), 105, 32, { align: 'center' });

            const tableData = data.map((item, idx) => [
                idx + 1,
                item.barcode,
                item.name,
                item.brand,
                item.year_acquired,
                item.condition_status.toUpperCase(),
                item.room_name || '-'
            ]);

            doc.autoTable({
                head: [['No', 'Barcode', 'Nama Barang', 'Merk', 'Tahun', 'Kondisi', 'Lokasi']],
                body: tableData,
                startY: 40,
                theme: 'grid',
                headStyles: { fillColor: [33, 37, 41] }
            });

            doc.save(title.replace(/\s+/g, '_') + '.pdf');
            
            document.getElementById('status').innerHTML = "Selesai! Anda bisa <a href='index.php'>kembali ke Dashboard</a>";
            
            // Auto redirect back after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 3000);
        }

        window.onload = generatePDF;
    </script>
</body>
</html>
