<?php
// ===== 디버그 및 성능 최적화 설정 =====
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// PHP 리소스 제한 대폭 확장
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', '600');
ini_set('max_input_time', '600');
ini_set('post_max_size', '100M');
ini_set('upload_max_filesize', '100M');

// JSON 에러 핸들러
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'PHP Error',
        'type' => 'Runtime Error',
        'code' => $errno,
        'message' => $errstr,
        'file' => basename($errfile),
        'line' => $errline,
        'timestamp' => date('Y-m-d H:i:s'),
        'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
        'memory_peak' => round(memory_get_peak_usage() / 1024 / 1024, 2) . ' MB'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
});

register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Fatal Error',
            'type' => 'Shutdown Error',
            'message' => $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line'],
            'timestamp' => date('Y-m-d H:i:s'),
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'memory_peak' => round(memory_get_peak_usage() / 1024 / 1024, 2) . ' MB'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
});

/**
 * Certificates API - RESTful 엔드포인트
 */

require_once 'config.php';

// 데이터베이스 연결
$pdo = getDBConnection();

// MySQL 설정 최적화 (MariaDB 10.11 호환)
// max_allowed_packet은 SESSION에서 설정 불가, GLOBAL만 가능
try {
    $pdo->exec("SET SESSION wait_timeout = 600");
    $pdo->exec("SET SESSION net_read_timeout = 600");
    $pdo->exec("SET SESSION net_write_timeout = 600");
} catch (Exception $e) {
    // 설정 실패해도 계속 진행
}

// 요청 메소드
$method = $_SERVER['REQUEST_METHOD'];

// URL에서 ID 추출
$id = isset($_GET['id']) ? $_GET['id'] : null;

// GET 요청: 목록 조회 또는 단일 조회
if ($method === 'GET') {
    if ($id) {
        // 단일 레코드 조회
        $stmt = $pdo->prepare("SELECT * FROM certificates WHERE id = ? AND deleted = 0");
        $stmt->execute([$id]);
        $record = $stmt->fetch();
        
        if ($record) {
            jsonResponse($record);
        } else {
            errorResponse('Record not found', 404);
        }
    } else {
        // 목록 조회 (페이지네이션)
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
        $offset = ($page - 1) * $limit;
        
        // 검색
        $search = isset($_GET['search']) ? $_GET['search'] : '';
        $where = "deleted = 0";
        $params = [];
        
        if ($search) {
            $where .= " AND (issueNo LIKE ? OR companyName LIKE ? OR siteName LIKE ?)";
            $searchParam = "%$search%";
            $params = [$searchParam, $searchParam, $searchParam];
        }
        
        // 정렬 (- 접두사 처리)
        $sortParam = isset($_GET['sort']) ? $_GET['sort'] : 'created_at';
        $sortOrder = 'DESC';
        $sort = $sortParam;
        
        // - 접두사가 있으면 제거하고 DESC, 없으면 ASC
        if (substr($sortParam, 0, 1) === '-') {
            $sort = substr($sortParam, 1);
            $sortOrder = 'DESC';
        } else {
            $sortOrder = 'ASC';
        }
        
        $allowedSort = ['created_at', 'updated_at', 'issueNo', 'issueDate'];
        if (!in_array($sort, $allowedSort)) {
            $sort = 'created_at';
            $sortOrder = 'DESC';
        }
        
        // 전체 개수
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM certificates WHERE $where");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // 데이터 조회 (리스트용 - PDF 데이터 제외)
        // SELECT * 대신 필요한 컬럼만 조회 (PDF 제외)
        $columns = "id, documentType, issueNo, companyName, siteName, siteAddress, quantity, issueDate, deliveryDate, issuer, notes, pdfFileName, pdfFileSize, deliveryPdfFileName, deliveryPdfFileSize, qualityPdfFileName, qualityPdfFileSize, created_at, updated_at, deleted";
        
        // 데이터 조회용 파라미터 (기존 검색 파라미터 + LIMIT + OFFSET)
        $dataParams = $params;  // 검색 파라미터 복사
        $dataParams[] = $limit;
        $dataParams[] = $offset;
        
        $stmt = $pdo->prepare("SELECT $columns FROM certificates WHERE $where ORDER BY $sort $sortOrder LIMIT ? OFFSET ?");
        $stmt->execute($dataParams);
        $records = $stmt->fetchAll();
        
        jsonResponse([
            'data' => $records,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'table' => 'certificates'
        ]);
    }
}

// POST 요청: 새 레코드 생성
elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON', 400);
    }
    
    // 필수 필드 확인
    if (empty($input['issueNo']) || empty($input['companyName'])) {
        errorResponse('Missing required fields: issueNo, companyName', 400);
    }
    
    // ID 생성
    $id = generateUUID();
    $now = time() * 1000; // milliseconds
    
    // 데이터 준비
    $data = [
        'id' => $id,
        'documentType' => $input['documentType'] ?? 'quality',
        'issueNo' => $input['issueNo'],
        'companyName' => $input['companyName'],
        'siteName' => $input['siteName'] ?? null,
        'siteAddress' => $input['siteAddress'] ?? null,
        'quantity' => $input['quantity'] ?? null,
        'issueDate' => $input['issueDate'] ?? null,
        'deliveryDate' => $input['deliveryDate'] ?? null,
        'issuer' => $input['issuer'] ?? null,
        'notes' => $input['notes'] ?? null,
        'pdfData' => $input['pdfData'] ?? null,
        'pdfFileName' => $input['pdfFileName'] ?? null,
        'pdfFileSize' => $input['pdfFileSize'] ?? null,
        'deliveryPdfData' => $input['deliveryPdfData'] ?? null,
        'deliveryPdfFileName' => $input['deliveryPdfFileName'] ?? null,
        'deliveryPdfFileSize' => $input['deliveryPdfFileSize'] ?? null,
        'qualityPdfData' => $input['qualityPdfData'] ?? null,
        'qualityPdfFileName' => $input['qualityPdfFileName'] ?? null,
        'qualityPdfFileSize' => $input['qualityPdfFileSize'] ?? null,
        'created_at' => $now,
        'updated_at' => $now,
        'deleted' => 0
    ];
    
    // INSERT 쿼리
    $fields = array_keys($data);
    $placeholders = array_fill(0, count($fields), '?');
    
    $sql = "INSERT INTO certificates (" . implode(', ', $fields) . ") 
            VALUES (" . implode(', ', $placeholders) . ")";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute(array_values($data));
    
    jsonResponse($data, 201);
}

// PUT 요청: 전체 업데이트
elseif ($method === 'PUT') {
    if (!$id) {
        errorResponse('ID required for PUT', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON', 400);
    }
    
    // 기존 레코드 확인
    $stmt = $pdo->prepare("SELECT * FROM certificates WHERE id = ? AND deleted = 0");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        errorResponse('Record not found', 404);
    }
    
    // 데이터 준비
    $now = time() * 1000;
    $data = array_merge($existing, $input);
    $data['updated_at'] = $now;
    unset($data['id'], $data['created_at']);
    
    // UPDATE 쿼리
    $fields = array_keys($data);
    $setClause = implode(' = ?, ', $fields) . ' = ?';
    
    $sql = "UPDATE certificates SET $setClause WHERE id = ?";
    $values = array_values($data);
    $values[] = $id;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    jsonResponse(array_merge(['id' => $id], $data));
}

// PATCH 요청: 부분 업데이트
elseif ($method === 'PATCH') {
    if (!$id) {
        errorResponse('ID required for PATCH', 400);
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        errorResponse('Invalid JSON', 400);
    }
    
    // 기존 레코드 확인
    $stmt = $pdo->prepare("SELECT * FROM certificates WHERE id = ? AND deleted = 0");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        errorResponse('Record not found', 404);
    }
    
    // 업데이트할 필드만 처리
    $now = time() * 1000;
    $input['updated_at'] = $now;
    
    $fields = array_keys($input);
    $setClause = implode(' = ?, ', $fields) . ' = ?';
    
    $sql = "UPDATE certificates SET $setClause WHERE id = ?";
    $values = array_values($input);
    $values[] = $id;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    jsonResponse(array_merge($existing, $input));
}

// DELETE 요청: 소프트 삭제
elseif ($method === 'DELETE') {
    if (!$id) {
        errorResponse('ID required for DELETE', 400);
    }
    
    // 소프트 삭제
    $stmt = $pdo->prepare("UPDATE certificates SET deleted = 1, updated_at = ? WHERE id = ?");
    $now = time() * 1000;
    $stmt->execute([$now, $id]);
    
    if ($stmt->rowCount() > 0) {
        http_response_code(204);
        exit();
    } else {
        errorResponse('Record not found', 404);
    }
}

else {
    errorResponse('Method not allowed', 405);
}
