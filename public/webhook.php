<?php
require_once __DIR__ . '/webhook_config.php';

// Ensure logs directory exists
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    mkdir($logDir, 0755, true);
}

function writeLog(string $message): void {
    $line = date('Y-m-d H:i:s') . ' ' . $message . PHP_EOL;
    file_put_contents(__DIR__ . '/logs/webhook.log', $line, FILE_APPEND);
}

function respond(int $code, array $body): void {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($body);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$rawBody  = file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verify Stripe signature
$parts = [];
foreach (explode(',', $sigHeader) as $part) {
    [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
    $parts[$k] = $v;
}

$timestamp = $parts['t'] ?? '';
$v1        = $parts['v1'] ?? '';

if (!$timestamp || !$v1) {
    writeLog('ERROR: missing signature components');
    respond(400, ['error' => 'Invalid signature']);
}

// Reject events older than 5 minutes
if (abs(time() - (int)$timestamp) > 300) {
    writeLog('ERROR: timestamp too old');
    respond(400, ['error' => 'Timestamp too old']);
}

$expected = hash_hmac('sha256', $timestamp . '.' . $rawBody, STRIPE_WEBHOOK_SECRET);

if (!hash_equals($expected, $v1)) {
    writeLog('ERROR: signature mismatch');
    respond(400, ['error' => 'Signature mismatch']);
}

$event = json_decode($rawBody, true);
if (!$event) {
    writeLog('ERROR: invalid JSON payload');
    respond(400, ['error' => 'Invalid JSON']);
}

$type = $event['type'] ?? '';
writeLog("EVENT: $type");

if ($type !== 'checkout.session.completed') {
    respond(200, ['received' => true]);
}

$session = $event['data']['object'] ?? [];
$uid     = $session['client_reference_id'] ?? '';

if (!$uid) {
    writeLog('ERROR: missing client_reference_id');
    respond(400, ['error' => 'Missing UID']);
}

// Determine plan from metadata or amount_total
$plan = $session['metadata']['plan'] ?? '';

if (!$plan) {
    $amount = (int)($session['amount_total'] ?? 0);
    $plan = match($amount) {
        1000 => 'mini',
        2000 => 'midi',
        3000 => 'maxi',
        6000 => 'vip',
        default => ''
    };
}

if (!$plan) {
    writeLog("ERROR: cannot determine plan for uid=$uid amount={$session['amount_total']}");
    respond(400, ['error' => 'Unknown plan']);
}

writeLog("PLAN: uid=$uid plan=$plan");

// planExpiry = now + 365 days in milliseconds
$planExpiry = (time() + 365 * 24 * 3600) * 1000;

// Build Firestore PATCH fields
$fields = [
    'plan'       => ['stringValue' => $plan],
    'planExpiry' => ['integerValue' => (string)$planExpiry],
];

if ($plan !== 'vip') {
    $fields['calculatorPlans.masarz.plan']   = ['stringValue' => $plan];
    $fields['calculatorPlans.masarz.expiry'] = ['integerValue' => (string)$planExpiry];
} else {
    $fields['vipRecipesLimit'] = ['integerValue' => '100'];
}

$updateMask = implode('&', array_map(
    fn($f) => 'updateMask.fieldPaths=' . urlencode($f),
    array_keys($fields)
));

$url = 'https://firestore.googleapis.com/v1/projects/' . FIREBASE_PROJECT_ID
     . '/databases/(default)/documents/users/' . urlencode($uid)
     . '?' . $updateMask
     . '&key=' . FIREBASE_API_KEY;

$payload = json_encode(['fields' => $fields]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'PATCH',
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError  = curl_error($ch);
curl_close($ch);

if ($curlError) {
    writeLog("ERROR: curl failed: $curlError");
    respond(400, ['error' => 'Firestore request failed']);
}

if ($httpCode < 200 || $httpCode >= 300) {
    writeLog("ERROR: Firestore responded $httpCode: $response");
    respond(400, ['error' => 'Firestore update failed']);
}

writeLog("OK: uid=$uid plan=$plan updated in Firestore");
respond(200, ['received' => true]);
