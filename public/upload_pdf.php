<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/ads/';
$baseUrl   = 'https://www.masarz.ebra.pl/ads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload error: ' . $file['error']]);
    exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime  = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if ($mime !== 'application/pdf') {
    http_response_code(400);
    echo json_encode(['error' => 'Only PDF files are allowed']);
    exit;
}

if ($file['size'] > 20 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large (max 20 MB)']);
    exit;
}

$filename = uniqid('ad_', true) . '.pdf';
$dest     = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

echo json_encode(['url' => $baseUrl . $filename]);
