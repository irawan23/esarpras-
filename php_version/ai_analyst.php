<?php
// php_version/ai_analyst.php
require_once 'config.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    die("Akses Ditolak");
}

function getGeminiAnalysis($data, $apiKey) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

    $payload = [
        "contents" => [
            [
                "parts" => [
                    ["text" => "Anda adalah pakar Sarpras. Analisis data berikut dan berikan rekomendasi strategis dalam format Markdown: " . json_encode($data)]
                ]
            ]
        ]
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($response, true);
}

// Ambil data ringkasan untuk dianalisis
$res = $conn->query("SELECT COUNT(*) as total FROM inventory_items WHERE status = 'aktif'");
$summary = $res->fetch_assoc();

$apiKey = "ISI_DENGAN_API_KEY_ANDA"; // Masukkan API Key Gemini di sini
$analysis = getGeminiAnalysis($summary, $apiKey);

echo "<h1>Hasil Analisis AI</h1>";
echo "<pre>" . $analysis['candidates'][0]['content']['parts'][0]['text'] . "</pre>";
?>
