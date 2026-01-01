<?php
// CORS заголовки
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Определяем тип запроса
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Если это GET запрос с токеном в параметрах URL (из Telegram бота)
if ($requestMethod === 'GET' && isset($_GET['token'])) {
    try {
        // Получаем токен из параметров URL
        $token = $_GET['token'];
        
        if (empty($token)) {
            sendResponse(['error' => 'Токен не предоставлен'], 400);
        }
        
        // Декодируем JWT токен (без проверки подписи для упрощения)
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            sendResponse(['error' => 'Неверный формат токена'], 400);
        }
        
        $payload = json_decode(base64_decode($parts[1]), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(['error' => 'Ошибка декодирования токена: ' . json_last_error_msg()], 400);
        }
        
        // Проверяем обязательные поля
        if (!isset($payload['id']) || !isset($payload['first_name'])) {
            sendResponse(['error' => 'В токене отсутствуют обязательные данные'], 400);
        }
        
        // Используем те же данные, что и из JWT
        $input = [
            'id' => $payload['id'],
            'username' => $payload['username'] ?? null,
            'first_name' => $payload['first_name'],
            'last_name' => $payload['last_name'] ?? null,
            'photo_url' => null // В JWT токене нет photo_url
        ];
        
        // Продолжаем с обработкой как в оригинальном коде
        processUser($input);
        
    } catch (Exception $e) {
        sendResponse(['error' => 'Ошибка: ' . $e->getMessage()], 500);
    }
}
// Если это POST запрос с JSON данными (оригинальная логика)
elseif ($requestMethod === 'POST') {
    try {
        // Получаем данные (оригинальная логика)
        $raw_input = file_get_contents('php://input');
        
        if (empty($raw_input)) {
            sendResponse(['error' => 'Пустые данные'], 400);
        }
        
        $input = json_decode($raw_input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendResponse(['error' => 'Ошибка JSON: ' . json_last_error_msg()], 400);
        }
        
        // Проверяем обязательные поля
        if (!isset($input['id']) || !isset($input['first_name'])) {
            sendResponse(['error' => 'ID и имя обязательны'], 400);
        }
        
        // Продолжаем с обработкой как в оригинальном коде
        processUser($input);
        
    } catch (Exception $e) {
        sendResponse(['error' => 'Ошибка: ' . $e->getMessage()], 500);
    }
} else {
    sendResponse(['error' => 'Неподдерживаемый тип запроса'], 405);
}

function processUser($input) {
    try {
        // Подключение к БД
        $dsn = "mysql:host=server184.hosting.reg.ru;port=3306;dbname=moto_classifieds;charset=utf8mb4";
        $pdo = new PDO($dsn, 'u3183548_default', '81DitCnnDi2664KZ', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        
        $telegram_id = $input['id'];
        $username = $input['username'] ?? null;
        $first_name = $input['first_name'];
        $last_name = $input['last_name'] ?? null;
        $avatar_url = $input['photo_url'] ?? null;
        
        // Проверяем существует ли пользователь
        $stmt = $pdo->prepare("SELECT * FROM users WHERE telegram_id = ?");
        $stmt->execute([$telegram_id]);
        $existingUser = $stmt->fetch();
        
        if ($existingUser) {
            // Обновляем данные существующего пользователя
            $stmt = $pdo->prepare("
                UPDATE users 
                SET username = ?, first_name = ?, last_name = ?, avatar = ?, last_login = NOW(), updated_at = NOW() 
                WHERE telegram_id = ?
            ");
            $stmt->execute([$username, $first_name, $last_name, $avatar_url, $telegram_id]);
            $user = $existingUser;
        } else {
            // Создаем нового пользователя
            $name = trim($first_name . ' ' . ($last_name ?? ''));
            $member_since = date('Y');
            
            $stmt = $pdo->prepare("
                INSERT INTO users (telegram_id, username, first_name, last_name, name, avatar, member_since, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$telegram_id, $username, $first_name, $last_name, $name, $avatar_url, $member_since]);
            
            // Получаем созданного пользователя
            $userId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
        }
        
        // Создаем простой токен
        $token = base64_encode(json_encode([
            'userId' => $user['id'],
            'telegram_id' => $user['telegram_id'],
            'exp' => time() + (30 * 24 * 60 * 60)
        ]));
        
        // Подготавливаем ответ
        sendResponse([
            'status' => 'success',
            'message' => 'Авторизация успешна',
            'data' => [
                'user' => [
                    'id' => (int)$user['id'],
                    'telegram_id' => (int)$user['telegram_id'],
                    'username' => $user['username'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'name' => $user['name'],
                    'avatar' => $user['avatar'],
                    'phone' => $user['phone'],
                    'email' => $user['email'],
                    'location' => $user['location'],
                    'rating' => (float)($user['rating'] ?? 0.0),
                    'review_count' => (int)($user['review_count'] ?? 0),
                    'is_verified' => (bool)($user['is_verified'] ?? false),
                    'response_time' => $user['response_time'] ?? '1 час',
                    'member_since' => $user['member_since']
                ],
                'token' => $token
            ]
        ]);
        
    } catch (PDOException $e) {
        sendResponse(['error' => 'Ошибка БД: ' . $e->getMessage()], 500);
    }
}
?>
