<?php
/**
 * 시놀로지 NAS - 품질검사 API 설정
 * v1.0
 */

// CORS 헤더 설정
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS 요청 처리 (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 데이터베이스 연결 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'quality_system');
define('DB_USER', 'root');
define('DB_PASS', 'Choi9808@@');

// 데이터베이스 연결 함수
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        
        // 세션 타임아웃 설정
        try {
            $pdo->exec("SET SESSION wait_timeout = 600");
            $pdo->exec("SET SESSION net_read_timeout = 600");
            $pdo->exec("SET SESSION net_write_timeout = 600");
        } catch (Exception $e) {
            // 설정 실패해도 계속 진행
        }
        
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Database connection failed',
            'message' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// UUID 생성 함수
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

// JSON 응답 함수
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// 에러 응답 함수
function errorResponse($message, $statusCode = 400) {
    jsonResponse([
        'error' => $message,
        'status' => $statusCode
    ], $statusCode);
}
