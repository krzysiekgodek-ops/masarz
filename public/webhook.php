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

function base64url(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function getFirebaseToken(): string {
    $now = time();

    $header  = base64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
    $claims  = base64url(json_encode([
        'iss'   => FIREBASE_CLIENT_EMAIL,
        'sub'   => FIREBASE_CLIENT_EMAIL,
        'aud'   => 'https://oauth2.googleapis.com/token',
        'iat'   => $now,
        'exp'   => $now + 3600,
        'scope' => 'https://www.googleapis.com/auth/datastore',
    ]));

    $signingInput = "$header.$claims";

    // Convert \n escape sequences in the PEM key to actual newlines
    $privateKey = str_replace('\n', "\n", FIREBASE_PRIVATE_KEY);
    $pem = openssl_pkey_get_private($privateKey);
    if (!$pem) {
        throw new RuntimeException('Failed to load private key: ' . openssl_error_string());
    }

    $signature = '';
    if (!openssl_sign($signingInput, $signature, $pem, OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('Failed to sign JWT: ' . openssl_error_string());
    }

    $jwt = "$signingInput." . base64url($signature);

    // Exchange JWT for access token
    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
    ]);

    $response  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new RuntimeException("Token exchange curl error: $curlError");
    }

    $data = json_decode($response, true);

    if ($httpCode !== 200 || empty($data['access_token'])) {
        throw new RuntimeException("Token exchange failed ($httpCode): $response");
    }

    return $data['access_token'];
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Method not allowed']);
}

$rawBody   = file_get_contents('php://input');
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
    $plan   = match($amount) {
        1200 => 'mini',
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

// Obtain Firebase access token via Service Account JWT
try {
    $accessToken = getFirebaseToken();
} catch (RuntimeException $e) {
    writeLog('ERROR: ' . $e->getMessage());
    respond(400, ['error' => 'Auth token error']);
}

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
     . '?' . $updateMask;

$payload = json_encode(['fields' => $fields]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => 'PATCH',
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken,
    ],
]);

$response  = curl_exec($ch);
$httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
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
