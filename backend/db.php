<?php

declare(strict_types=1);

function env_string(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }

    return (string) $value;
}

function env_int(string $key, int $default): int
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }

    return is_numeric($value) ? (int) $value : $default;
}

function env_bool(string $key, bool $default): bool
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    return $parsed ?? $default;
}

function env_nullable_string(string $key): ?string
{
    $value = getenv($key);
    if ($value === false) {
        return null;
    }

    $trimmed = trim((string) $value);
    return $trimmed === '' ? null : $trimmed;
}

function app_env(): string
{
    return strtolower(env_string('APP_ENV', 'development'));
}

function is_production_env(): bool
{
    return in_array(app_env(), ['prod', 'production'], true);
}

function should_seed_default_admins(): bool
{
    return env_bool('APP_ENABLE_DEFAULT_ADMINS', !is_production_env());
}

function should_seed_demo_data(): bool
{
    return env_bool('APP_ENABLE_DEMO_SEED', !is_production_env());
}

function state_cache_ttl(): int
{
    return max(0, env_int('STATE_CACHE_TTL', 15));
}

function redis_config(): array
{
    $url = env_string('REDIS_URL');
    if ($url !== '') {
        $parts = parse_url($url);
        if ($parts !== false && isset($parts['host'])) {
            $database = 0;
            if (isset($parts['path'])) {
                $database = max(0, (int) ltrim((string) $parts['path'], '/'));
            }

            return [
                'enabled' => true,
                'scheme' => $parts['scheme'] ?? 'redis',
                'host' => $parts['host'],
                'port' => isset($parts['port']) ? (int) $parts['port'] : 6379,
                'password' => $parts['pass'] ?? env_string('REDIS_PASSWORD'),
                'database' => $database,
                'timeout' => (float) env_string('REDIS_TIMEOUT', '1.5'),
                'prefix' => env_string('REDIS_PREFIX', 'darcan:'),
            ];
        }
    }

    $host = env_string('REDIS_HOST');
    if ($host === '') {
        return [
            'enabled' => false,
            'scheme' => 'redis',
            'host' => '',
            'port' => 6379,
            'password' => '',
            'database' => 0,
            'timeout' => 1.5,
            'prefix' => env_string('REDIS_PREFIX', 'darcan:'),
        ];
    }

    return [
        'enabled' => true,
        'scheme' => env_string('REDIS_SCHEME', 'redis'),
        'host' => $host,
        'port' => env_int('REDIS_PORT', 6379),
        'password' => env_string('REDIS_PASSWORD'),
        'database' => env_int('REDIS_DB', 0),
        'timeout' => (float) env_string('REDIS_TIMEOUT', '1.5'),
        'prefix' => env_string('REDIS_PREFIX', 'darcan:'),
    ];
}

function cache_is_available(): bool
{
    return redis_client() !== null;
}

function redis_client(): ?object
{
    static $client = false;

    if ($client !== false) {
        return $client;
    }

    if (!class_exists('Redis')) {
        $client = null;
        return $client;
    }

    $config = redis_config();
    if (($config['enabled'] ?? false) !== true) {
        $client = null;
        return $client;
    }

    try {
        $redis = new Redis();
        $redis->connect($config['host'], (int) $config['port'], (float) $config['timeout']);

        if (($config['password'] ?? '') !== '') {
            $redis->auth((string) $config['password']);
        }

        $database = (int) ($config['database'] ?? 0);
        if ($database > 0) {
            $redis->select($database);
        }

        $redis->ping();
        $client = $redis;
    } catch (Throwable $exception) {
        $client = null;
    }

    return $client;
}

function cache_key(string $key): string
{
    $config = redis_config();
    return (string) ($config['prefix'] ?? 'darcan:') . $key;
}

function cache_get(string $key): ?string
{
    $redis = redis_client();
    if ($redis === null) {
        return null;
    }

    try {
        $value = $redis->get(cache_key($key));
        return is_string($value) ? $value : null;
    } catch (Throwable $exception) {
        return null;
    }
}

function cache_set(string $key, string $value, int $ttlSeconds = 60): void
{
    $redis = redis_client();
    if ($redis === null) {
        return;
    }

    try {
        if ($ttlSeconds > 0) {
            $redis->setex(cache_key($key), $ttlSeconds, $value);
            return;
        }

        $redis->set(cache_key($key), $value);
    } catch (Throwable $exception) {
    }
}

function cache_delete(string $key): void
{
    $redis = redis_client();
    if ($redis === null) {
        return;
    }

    try {
        $redis->del(cache_key($key));
    } catch (Throwable $exception) {
    }
}

function invalidate_state_cache(): void
{
    cache_delete('state:full');
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $host = env_string('MYSQLHOST', 'db');
    $user = env_string('MYSQLUSER', 'user');
    $password = env_string('MYSQLPASSWORD', 'password');
    $database = env_string('MYSQLDATABASE', 'darcan');
    $port = env_string('MYSQLPORT', '3306');
    $sslCa = env_nullable_string('MYSQL_SSL_CA');
    $sslVerifyServerCert = env_bool('MYSQL_SSL_VERIFY_SERVER_CERT', true);

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);

    $attempts = 90;
    $lastException = null;

    for ($attempt = 1; $attempt <= $attempts; $attempt += 1) {
        try {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];

            if (defined('PDO::MYSQL_ATTR_SSL_CA') && $sslCa !== null) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = $sslCa;
            }

            if (defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) {
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = $sslVerifyServerCert;
            }

            $pdo = new PDO($dsn, $user, $password, $options);
            return $pdo;
        } catch (PDOException $exception) {
            $lastException = $exception;
            usleep(1000000);
        }
    }

    throw new RuntimeException(
        'Nao foi possivel ligar a base de dados: ' . ($lastException?->getMessage() ?? 'erro desconhecido'),
        0,
        $lastException
    );
}

function now_iso(): string
{
    return gmdate('c');
}

function new_id(string $prefix): string
{
    return sprintf('%s-%s', $prefix, bin2hex(random_bytes(6)));
}

function bootstrap_database(): void
{
    static $bootstrapped = false;

    if ($bootstrapped) {
        return;
    }

    $pdo = db();
    $schemaPath = __DIR__ . '/mysql/schema.sql';
    $schemaSql = file_get_contents($schemaPath);

    if ($schemaSql === false) {
        throw new RuntimeException('Nao foi possivel carregar o schema MySQL.');
    }

    $statements = preg_split('/;\s*[\r\n]+/', $schemaSql) ?: [];
    foreach ($statements as $statement) {
        $trimmed = trim($statement);
        if ($trimmed !== '') {
            $pdo->exec($trimmed);
        }
    }

    run_migrations($pdo);
    seed_system_config($pdo);

    if (should_seed_default_admins()) {
        seed_default_admins($pdo);
    }

    if (should_seed_demo_data()) {
        seed_demo_data($pdo);
    }

    $bootstrapped = true;
}

function safe_exec(PDO $pdo, string $sql): void
{
    try {
        $pdo->exec($sql);
    } catch (Throwable $exception) {
    }
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND COLUMN_NAME = :column_name'
    );
    $stmt->execute([
        'table_name' => $table,
        'column_name' => $column,
    ]);

    return (int) $stmt->fetchColumn() > 0;
}

function index_exists(PDO $pdo, string $table, string $index): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = :table_name
           AND INDEX_NAME = :index_name'
    );
    $stmt->execute([
        'table_name' => $table,
        'index_name' => $index,
    ]);

    return (int) $stmt->fetchColumn() > 0;
}

function run_migrations(PDO $pdo): void
{
    if (!column_exists($pdo, 'jobs', 'candidate_limit')) {
        $pdo->exec("ALTER TABLE jobs ADD COLUMN candidate_limit INT NOT NULL DEFAULT 1");
    }

    if (!column_exists($pdo, 'jobs', 'test_date')) {
        $pdo->exec("ALTER TABLE jobs ADD COLUMN test_date DATE NULL");
    }

    if (!column_exists($pdo, 'jobs', 'test_time')) {
        $pdo->exec("ALTER TABLE jobs ADD COLUMN test_time TIME NULL");
    }

    if (!column_exists($pdo, 'applications', 'workflow_status')) {
        $pdo->exec("ALTER TABLE applications ADD COLUMN workflow_status VARCHAR(64) NOT NULL DEFAULT 'DOCUMENTOS_PENDENTES'");
    }

    if (!column_exists($pdo, 'applications', 'test_scheduled_at')) {
        $pdo->exec("ALTER TABLE applications ADD COLUMN test_scheduled_at VARCHAR(40) NULL");
    }

    if (!column_exists($pdo, 'users', 'is_online')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_online TINYINT(1) NOT NULL DEFAULT 0");
    }

    if (!column_exists($pdo, 'users', 'last_seen_at')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP NULL DEFAULT NULL");
    }

    safe_exec($pdo, "ALTER TABLE applications MODIFY COLUMN cv_url LONGTEXT NOT NULL");
    safe_exec($pdo, "ALTER TABLE user_documents MODIFY COLUMN file_url LONGTEXT NULL");

    deduplicate_user_documents($pdo);

    if (!index_exists($pdo, 'user_documents', 'uniq_user_document')) {
        $pdo->exec("ALTER TABLE user_documents ADD UNIQUE INDEX uniq_user_document (user_id, document_type)");
    }

    if (!index_exists($pdo, 'applications', 'uniq_candidate_job')) {
        $pdo->exec("ALTER TABLE applications ADD UNIQUE INDEX uniq_candidate_job (candidate_id, job_id)");
    }

    remove_demo_managers($pdo);
    remove_demo_candidates($pdo);
    clear_legacy_audit_logs_once($pdo);
}

function deduplicate_user_documents(PDO $pdo): void
{
    safe_exec(
        $pdo,
        "DELETE older
         FROM user_documents older
         INNER JOIN user_documents newer
           ON older.user_id = newer.user_id
          AND older.document_type = newer.document_type
          AND (
                older.updated_at < newer.updated_at
                OR (older.updated_at = newer.updated_at AND older.created_at < newer.created_at)
                OR (older.updated_at = newer.updated_at AND older.created_at = newer.created_at AND older.id < newer.id)
              )"
    );
}

function remove_demo_managers(PDO $pdo): void
{
    $demoEmails = [
        'gestor@darcan.com',
        'ana@darcan.com',
        'carlos@darcan.com',
    ];

    $placeholders = implode(',', array_fill(0, count($demoEmails), '?'));
    $stmt = $pdo->prepare("DELETE FROM users WHERE role = 'MANAGER' AND LOWER(email) IN ($placeholders)");
    $stmt->execute($demoEmails);
}

function remove_demo_candidates(PDO $pdo): void
{
    $demoCandidateIds = ['cand-1'];
    $placeholders = implode(',', array_fill(0, count($demoCandidateIds), '?'));

    $pdo->prepare("DELETE FROM user_documents WHERE user_id IN ($placeholders)")
        ->execute($demoCandidateIds);

    $pdo->prepare("DELETE FROM applications WHERE candidate_id IN ($placeholders)")
        ->execute($demoCandidateIds);

    $pdo->prepare("DELETE FROM messages WHERE receiver_id IN ($placeholders)")
        ->execute($demoCandidateIds);

    $pdo->prepare("DELETE FROM notifications WHERE target_user_id IN ($placeholders)")
        ->execute($demoCandidateIds);

    $pdo->prepare("DELETE FROM users WHERE id IN ($placeholders) AND role = 'CANDIDATE'")
        ->execute($demoCandidateIds);
}

function clear_legacy_audit_logs_once(PDO $pdo): void
{
    safe_exec(
        $pdo,
        'CREATE TABLE IF NOT EXISTS cleanup_flags (
            id VARCHAR(100) PRIMARY KEY,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    $markerId = 'audit_cleanup_v1';
    $checkStmt = $pdo->prepare('SELECT id FROM cleanup_flags WHERE id = :id LIMIT 1');
    $checkStmt->execute(['id' => $markerId]);
    if ($checkStmt->fetch()) {
        return;
    }

    $pdo->exec('DELETE FROM audit_logs');
    $insertStmt = $pdo->prepare('INSERT INTO cleanup_flags (id) VALUES (:id)');
    $insertStmt->execute(['id' => $markerId]);
}

function seed_default_admins(PDO $pdo): void
{
    $defaultUsers = [
        [
            'id' => 'admin-001',
            'name' => 'Administrador Darcan',
            'email' => 'admin@darcan.com',
            'role' => 'ADMIN',
            'password' => '12345678',
            'avatar' => 'https://picsum.photos/seed/admin/200',
            'restrictions_json' => json_encode(['disabledModules' => []], JSON_UNESCAPED_UNICODE),
            'document_status' => 'NOT_SUBMITTED',
            'is_blocked' => 0,
        ],
        [
            'id' => 'admin-002',
            'name' => 'Administrador Lavasys',
            'email' => 'admin@lavasys.com',
            'role' => 'ADMIN',
            'password' => '12345678',
            'avatar' => null,
            'restrictions_json' => json_encode(['disabledModules' => []], JSON_UNESCAPED_UNICODE),
            'document_status' => 'NOT_SUBMITTED',
            'is_blocked' => 0,
        ],
    ];

    $userStmt = $pdo->prepare(
        'INSERT IGNORE INTO users (
            id, name, email, password_hash, role, avatar, restrictions_json, document_status, is_blocked
        ) VALUES (
            :id, :name, :email, :password_hash, :role, :avatar, :restrictions_json, :document_status, :is_blocked
        )'
    );

    foreach ($defaultUsers as $user) {
        $userStmt->execute([
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'password_hash' => password_hash($user['password'], PASSWORD_BCRYPT),
            'role' => $user['role'],
            'avatar' => $user['avatar'],
            'restrictions_json' => $user['restrictions_json'],
            'document_status' => $user['document_status'],
            'is_blocked' => $user['is_blocked'],
        ]);
    }
}

function seed_system_config(PDO $pdo): void
{
    $configExists = (int) $pdo->query('SELECT COUNT(*) FROM system_config WHERE id = 1')->fetchColumn();
    if ($configExists === 0) {
        $stmt = $pdo->prepare(
            'INSERT INTO system_config (
                id, company_name, allow_new_registrations, audit_logs_enabled, notification_email,
                enable_notifications, hero_images_json, logo_url, about_us, contact_phone,
                contact_whatsapp, social_facebook, social_instagram, overview_title, overview_subtitle
            ) VALUES (
                1, :company_name, 1, 1, :notification_email,
                1, :hero_images_json, :logo_url, :about_us, :contact_phone,
                :contact_whatsapp, :social_facebook, :social_instagram, :overview_title, :overview_subtitle
            )'
        );

        $stmt->execute([
            'company_name' => 'Darcan',
            'notification_email' => 'rh@darcan.com',
            'hero_images_json' => json_encode([
                'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800&h=600',
                'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800&h=600',
                'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=800&h=600',
            ], JSON_UNESCAPED_SLASHES),
            'logo_url' => 'https://picsum.photos/seed/school-logo/100/100',
            'about_us' => 'A Darcan e uma instituicao de ensino comprometida com a excelencia academica e o desenvolvimento profissional.',
            'contact_phone' => '+244 923 000 000',
            'contact_whatsapp' => '+244 923 000 000',
            'social_facebook' => 'facebook.com/darcan',
            'social_instagram' => 'instagram.com/darcan',
            'overview_title' => 'Visao Geral',
            'overview_subtitle' => 'Informacoes principais da plataforma',
        ]);
    }
}

function seed_demo_data(PDO $pdo): void
{
    $jobs = [
        [
            'id' => 'job-1',
            'title' => 'Professor de Matematica',
            'department' => 'Area Pedagogica',
            'description' => 'Buscamos profissional dedicado para lecionar ensino medio.',
            'requirements_json' => json_encode(['Licenciatura em Matematica', '3 anos de experiencia'], JSON_UNESCAPED_UNICODE),
            'status' => 'OPEN',
            'created_at' => now_iso(),
            'deadline' => '2026-12-31',
            'test_id' => 'test-1',
            'candidate_limit' => 10,
            'test_date' => '2026-12-20',
            'test_time' => '09:00:00',
            'min_experience' => '3 anos',
            'work_location' => 'Luanda, Angola',
        ],
        [
            'id' => 'job-2',
            'title' => 'Analista de RH',
            'department' => 'Administracao e Financas',
            'description' => 'Gestao de beneficios e processos seletivos.',
            'requirements_json' => json_encode(['Psicologia ou Gestao de RH', 'Ingles Intermediario'], JSON_UNESCAPED_UNICODE),
            'status' => 'OPEN',
            'created_at' => now_iso(),
            'deadline' => '2026-12-15',
            'test_id' => 'test-2',
            'candidate_limit' => 5,
            'test_date' => '2026-12-18',
            'test_time' => '10:30:00',
            'min_experience' => '2 anos',
            'work_location' => 'Luanda, Angola',
        ],
    ];

    $jobStmt = $pdo->prepare(
        'INSERT IGNORE INTO jobs (
            id, title, department, description, requirements_json, status, created_at, deadline, test_id, candidate_limit, test_date, test_time, min_experience, work_location
        ) VALUES (
            :id, :title, :department, :description, :requirements_json, :status, :created_at, :deadline, :test_id, :candidate_limit, :test_date, :test_time, :min_experience, :work_location
        )'
    );
    foreach ($jobs as $job) {
        $jobStmt->execute($job);
    }

    $tests = [
        [
            'id' => 'test-1',
            'title' => 'Avaliacao de Conhecimentos Pedagogicos',
            'time_limit_hours' => 0,
            'time_limit_minutes' => 15,
            'time_limit_seconds' => 30,
            'min_pass_score' => 70,
            'questions' => [
                ['id' => 'q1', 'text' => 'A derivada da funcao f(x) = x² e igual a 2x?', 'type' => 'TRUE_FALSE', 'options' => null, 'correctAnswer' => 'TRUE', 'points' => 50],
                ['id' => 'q2', 'text' => 'A soma dos angulos internos de um triangulo equilatero e sempre 180 graus?', 'type' => 'TRUE_FALSE', 'options' => null, 'correctAnswer' => 'TRUE', 'points' => 50],
            ],
        ],
        [
            'id' => 'test-2',
            'title' => 'Raciocinio Logico e Normas Internas',
            'time_limit_hours' => 1,
            'time_limit_minutes' => 10,
            'time_limit_seconds' => 45,
            'min_pass_score' => 60,
            'questions' => [
                ['id' => 'q3', 'text' => 'A sigla CLT refere-se a Consolidacao das Leis do Trabalho?', 'type' => 'TRUE_FALSE', 'options' => null, 'correctAnswer' => 'TRUE', 'points' => 100],
            ],
        ],
    ];

    foreach ($tests as $test) {
        upsert_test($pdo, $test);
    }
}

function decode_json(?string $value, array $fallback = []): array
{
    if ($value === null || $value === '') {
        return $fallback;
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function fetch_system_config(PDO $pdo): array
{
    $row = $pdo->query('SELECT * FROM system_config WHERE id = 1')->fetch();
    if (!$row) {
        return [];
    }

    return [
        'companyName' => $row['company_name'],
        'allowNewRegistrations' => (bool) $row['allow_new_registrations'],
        'auditLogsEnabled' => (bool) $row['audit_logs_enabled'],
        'notificationEmail' => $row['notification_email'],
        'enableNotifications' => (bool) $row['enable_notifications'],
        'heroImages' => decode_json($row['hero_images_json']),
        'logoUrl' => $row['logo_url'],
        'aboutUs' => $row['about_us'],
        'contactPhone' => $row['contact_phone'],
        'contactWhatsapp' => $row['contact_whatsapp'],
        'socialFacebook' => $row['social_facebook'],
        'socialInstagram' => $row['social_instagram'],
        'overviewTitle' => $row['overview_title'],
        'overviewSubtitle' => $row['overview_subtitle'],
    ];
}

function fetch_users(PDO $pdo): array
{
    $users = $pdo->query('SELECT * FROM users ORDER BY created_at ASC')->fetchAll();

    $documentsRows = $pdo->query('SELECT * FROM user_documents ORDER BY updated_at ASC, created_at ASC, id ASC')->fetchAll();
    $documentsByUser = [];
    foreach ($documentsRows as $row) {
        $documentsByUser[$row['user_id']][$row['document_type']] = $row;
    }

    return array_map(static function (array $row) use ($documentsByUser): array {
        $userDocs = $documentsByUser[$row['id']] ?? [];
        return [
            'id' => $row['id'],
            'name' => $row['name'],
            'email' => $row['email'],
            'role' => $row['role'],
            'avatar' => $row['avatar'],
            'restrictions' => $row['restrictions_json'] ? decode_json($row['restrictions_json']) : null,
            'documentStatus' => $row['document_status'],
            'documents' => [
                'cvName' => $userDocs['CV']['file_name'] ?? null,
                'cvUrl' => $userDocs['CV']['file_url'] ?? null,
                'biName' => $userDocs['BI']['file_name'] ?? null,
                'biUrl' => $userDocs['BI']['file_url'] ?? null,
                'diplomaName' => $userDocs['DIPLOMA']['file_name'] ?? null,
                'diplomaUrl' => $userDocs['DIPLOMA']['file_url'] ?? null,
            ],
            'birthDate' => $row['birth_date'],
            'gender' => $row['gender'],
            'address' => $row['address'],
            'phone' => $row['phone'],
            'education' => $row['education'],
            'experience' => $row['experience'],
            'interestArea' => $row['interest_area'],
            'profileComplete' => (bool) $row['profile_complete'],
            'isBlocked' => (bool) $row['is_blocked'],
            'linkedin' => $row['linkedin'],
            'isOnline' => (bool) ($row['is_online'] ?? 0),
            'lastSeenAt' => $row['last_seen_at'],
        ];
    }, $users);
}

function fetch_jobs(PDO $pdo): array
{
    $counts = $pdo->query("SELECT job_id, COUNT(*) AS total FROM applications WHERE status <> 'REJECTED' GROUP BY job_id")->fetchAll();
    $countsByJob = [];
    foreach ($counts as $count) {
        $countsByJob[$count['job_id']] = (int) $count['total'];
    }

    $rows = $pdo->query('SELECT * FROM jobs ORDER BY created_at DESC')->fetchAll();
    return array_map(static function (array $row) use ($countsByJob): array {
        $currentCandidates = $countsByJob[$row['id']] ?? 0;
        $candidateLimit = (int) ($row['candidate_limit'] ?? 1);
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'department' => $row['department'],
            'description' => $row['description'],
            'requirements' => decode_json($row['requirements_json']),
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
            'deadline' => $row['deadline'],
            'testId' => $row['test_id'],
            'candidateLimit' => $candidateLimit,
            'currentCandidates' => $currentCandidates,
            'filled' => $candidateLimit > 0 && $currentCandidates >= $candidateLimit,
            'testDate' => $row['test_date'],
            'testTime' => $row['test_time'],
            'minExperience' => $row['min_experience'],
            'workLocation' => $row['work_location'],
        ];
    }, $rows);
}

function fetch_tests(PDO $pdo): array
{
    $tests = $pdo->query('SELECT * FROM tests ORDER BY created_at DESC')->fetchAll();
    $questions = $pdo->query('SELECT * FROM test_questions ORDER BY sort_order ASC, created_at ASC')->fetchAll();

    $questionsByTest = [];
    foreach ($questions as $question) {
        $questionsByTest[$question['test_id']][] = [
            'id' => $question['id'],
            'text' => $question['question_text'],
            'type' => $question['question_type'],
            'options' => decode_json($question['options_json']),
            'correctAnswer' => $question['correct_answer'],
            'points' => (int) $question['points'],
        ];
    }

    return array_map(static function (array $row) use ($questionsByTest): array {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'questions' => $questionsByTest[$row['id']] ?? [],
            'timeLimitHours' => (int) $row['time_limit_hours'],
            'timeLimitMinutes' => (int) $row['time_limit_minutes'],
            'timeLimitSeconds' => (int) $row['time_limit_seconds'],
            'minPassScore' => (int) $row['min_pass_score'],
        ];
    }, $tests);
}

function fetch_applications(PDO $pdo): array
{
    refresh_test_availability($pdo);

    $rows = $pdo->query(
        'SELECT applications.*, jobs.test_date, jobs.test_time, tests.time_limit_hours, tests.time_limit_minutes, tests.time_limit_seconds
         FROM applications
         INNER JOIN jobs ON jobs.id = applications.job_id
         LEFT JOIN tests ON tests.id = jobs.test_id
         ORDER BY applications.applied_at DESC'
    )->fetchAll();

    return array_map(static function (array $row): array {
        $jobScheduledAt = combine_test_datetime($row['test_date'] ?? null, $row['test_time'] ?? null);
        $scheduledAt = in_array($row['status'], ['PENDING_CV', 'PENDING_TEST', 'TEST_IN_PROGRESS'], true)
            ? ($jobScheduledAt ?: $row['test_scheduled_at'])
            : ($row['test_scheduled_at'] ?: $jobScheduledAt);
        $testAvailable = false;
        if ($scheduledAt && in_array($row['status'], ['PENDING_TEST', 'TEST_IN_PROGRESS'], true)) {
            $windowSeconds = get_test_window_seconds($row);
            $scheduledTimestamp = strtotime($scheduledAt);
            $testAvailable = $scheduledTimestamp <= time() && time() <= ($scheduledTimestamp + $windowSeconds);
        }

        return [
            'id' => $row['id'],
            'jobId' => $row['job_id'],
            'candidateId' => $row['candidate_id'],
            'status' => $row['status'],
            'workflowStatus' => $row['workflow_status'],
            'appliedAt' => $row['applied_at'],
            'cvUrl' => $row['cv_url'],
            'testScheduledAt' => $scheduledAt,
            'testAvailable' => $testAvailable,
            'testScore' => $row['test_score'] !== null ? (float) $row['test_score'] : null,
            'testCompletedAt' => $row['test_completed_at'],
            'interviewDate' => $row['interview_date'],
            'interviewLocation' => $row['interview_location'],
            'interviewNotes' => $row['interview_notes'],
            'feedback' => $row['feedback'],
            'blockedUntil' => $row['blocked_until'],
            'evaluation' => $row['evaluation_json'] ? decode_json($row['evaluation_json']) : null,
        ];
    }, $rows);
}

function combine_test_datetime(?string $date, ?string $time): ?string
{
    if (!$date || !$time) {
        return null;
    }

    $normalizedTime = strlen($time) === 5 ? $time . ':00' : $time;
    $timezone = new DateTimeZone('Africa/Luanda');
    $dateTime = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $date . ' ' . $normalizedTime, $timezone);

    if (!$dateTime instanceof DateTimeImmutable) {
        return null;
    }

    return $dateTime->format(DateTimeInterface::ATOM);
}

function get_test_window_seconds(array $row): int
{
    $hours = max(0, (int) ($row['time_limit_hours'] ?? 0));
    $minutes = max(0, (int) ($row['time_limit_minutes'] ?? 0));
    $seconds = max(0, (int) ($row['time_limit_seconds'] ?? 0));
    $totalSeconds = ($hours * 3600) + ($minutes * 60) + $seconds;

    return max(60, $totalSeconds);
}

function notification_exists(PDO $pdo, string $targetUserId, string $title, string $message): bool
{
    $stmt = $pdo->prepare('SELECT id FROM notifications WHERE target_user_id = :target_user_id AND title = :title AND message = :message LIMIT 1');
    $stmt->execute([
        'target_user_id' => $targetUserId,
        'title' => $title,
        'message' => $message,
    ]);

    return (bool) $stmt->fetch();
}

function create_notification(PDO $pdo, string $title, string $message, string $type = 'INFO', ?string $targetUserId = null, ?string $senderRole = null): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO notifications (id, title, message, type, target_user_id, sender_role, created_at, is_read)
         VALUES (:id, :title, :message, :type, :target_user_id, :sender_role, :created_at, 0)'
    );
    $stmt->execute([
        'id' => new_id('notif'),
        'title' => $title,
        'message' => $message,
        'type' => $type,
        'target_user_id' => $targetUserId,
        'sender_role' => $senderRole,
        'created_at' => now_iso(),
    ]);
}

function refresh_test_availability(PDO $pdo): void
{
    $rows = $pdo->query(
        "SELECT applications.id, applications.candidate_id, applications.workflow_status, applications.status, applications.test_completed_at,
                jobs.title, jobs.test_date, jobs.test_time,
                tests.time_limit_hours, tests.time_limit_minutes, tests.time_limit_seconds
         FROM applications
         INNER JOIN jobs ON jobs.id = applications.job_id
         LEFT JOIN tests ON tests.id = jobs.test_id
         WHERE applications.status IN ('PENDING_TEST', 'TEST_IN_PROGRESS')"
    )->fetchAll();

    foreach ($rows as $row) {
        $scheduledAt = combine_test_datetime($row['test_date'] ?? null, $row['test_time'] ?? null);
        if (!$scheduledAt) {
            continue;
        }

        $scheduledTimestamp = strtotime($scheduledAt);
        if ($scheduledTimestamp === false) {
            continue;
        }

        $windowSeconds = get_test_window_seconds($row);
        $deadlineTimestamp = $scheduledTimestamp + $windowSeconds;

        if ($row['test_completed_at']) {
            continue;
        }

        if (time() > $deadlineTimestamp) {
            $pdo->prepare(
                "UPDATE applications
                 SET status = 'REJECTED',
                     workflow_status = 'TESTE_EXPIRADO',
                     test_scheduled_at = :test_scheduled_at,
                     feedback = :feedback,
                     blocked_until = :blocked_until,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id"
            )->execute([
                'id' => $row['id'],
                'test_scheduled_at' => $scheduledAt,
                'feedback' => 'O teste expirou porque a data e a hora definidas já passaram sem conclusão do candidato.',
                'blocked_until' => now_iso(),
            ]);

            $expiredMessage = sprintf('Já não poderá realizar o teste da vaga "%s" porque a data e a hora definidas já passaram.', $row['title']);
            if (!notification_exists($pdo, $row['candidate_id'], 'Prazo do teste expirado', $expiredMessage)) {
                create_notification($pdo, 'Prazo do teste expirado', $expiredMessage, 'INFO', $row['candidate_id'], 'MANAGER');
            }
            continue;
        }

        if ($scheduledTimestamp > time()) {
            continue;
        }

        if ($row['workflow_status'] !== 'TESTE_DISPONIVEL') {
            $pdo->prepare('UPDATE applications SET workflow_status = :workflow_status, test_scheduled_at = :test_scheduled_at, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
                ->execute([
                    'id' => $row['id'],
                    'workflow_status' => 'TESTE_DISPONIVEL',
                    'test_scheduled_at' => $scheduledAt,
                ]);
        }

        $message = sprintf('O seu teste para a vaga "%s" já está disponível para realização.', $row['title']);
        if (!notification_exists($pdo, $row['candidate_id'], 'Teste disponível', $message)) {
            create_notification($pdo, 'Teste disponível', $message, 'INFO', $row['candidate_id'], 'MANAGER');
        }
    }
}

function fetch_notifications(PDO $pdo): array
{
    $rows = $pdo->query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200')->fetchAll();
    return array_map(static function (array $row): array {
        return [
            'id' => $row['id'],
            'title' => $row['title'],
            'message' => $row['message'],
            'timestamp' => $row['created_at'],
            'read' => (bool) $row['is_read'],
            'type' => $row['type'],
            'targetUserId' => $row['target_user_id'],
            'senderRole' => $row['sender_role'],
        ];
    }, $rows);
}

function fetch_messages(PDO $pdo): array
{
    $rows = $pdo->query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 500')->fetchAll();
    return array_map(static function (array $row): array {
        return [
            'id' => $row['id'],
            'senderId' => $row['sender_id'],
            'senderName' => $row['sender_name'],
            'senderRole' => $row['sender_role'],
            'receiverId' => $row['receiver_id'],
            'receiverRole' => $row['receiver_role'],
            'subject' => $row['subject'],
            'content' => $row['content'],
            'timestamp' => $row['created_at'],
            'read' => (bool) $row['is_read'],
        ];
    }, $rows);
}

function fetch_audit_logs(PDO $pdo): array
{
    $rows = $pdo->query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500')->fetchAll();
    return array_map(static function (array $row): array {
        return [
            'id' => $row['id'],
            'userId' => $row['user_id'],
            'userName' => $row['user_name'],
            'userRole' => $row['user_role'],
            'action' => $row['action_text'],
            'module' => $row['module_name'],
            'timestamp' => $row['created_at'],
            'ipAddress' => $row['ip_address'],
        ];
    }, $rows);
}

function fetch_state(PDO $pdo, bool $forceFresh = false): array
{
    if (!$forceFresh) {
        $cached = cache_get('state:full');
        if ($cached !== null) {
            $decoded = json_decode($cached, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
    }

    $users = fetch_users($pdo);
    $adminUser = null;
    $candidates = [];
    $managers = [];

    foreach ($users as $user) {
        if ($user['role'] === 'ADMIN' && $adminUser === null) {
            $adminUser = $user;
        } elseif ($user['role'] === 'CANDIDATE') {
            $candidates[] = $user;
        } elseif ($user['role'] === 'MANAGER') {
            $managers[] = $user;
        }
    }

    $state = [
        'users' => $users,
        'adminUser' => $adminUser,
        'candidates' => $candidates,
        'managers' => $managers,
        'jobs' => fetch_jobs($pdo),
        'tests' => fetch_tests($pdo),
        'applications' => fetch_applications($pdo),
        'notifications' => fetch_notifications($pdo),
        'messages' => fetch_messages($pdo),
        'auditLogs' => fetch_audit_logs($pdo),
        'systemConfig' => fetch_system_config($pdo),
    ];

    $encodedState = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_string($encodedState)) {
        cache_set('state:full', $encodedState, state_cache_ttl());
    }

    return $state;
}

function upsert_test(PDO $pdo, array $payload): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO tests (
            id, title, time_limit_hours, time_limit_minutes, time_limit_seconds, min_pass_score
        ) VALUES (
            :id, :title, :time_limit_hours, :time_limit_minutes, :time_limit_seconds, :min_pass_score
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            time_limit_hours = VALUES(time_limit_hours),
            time_limit_minutes = VALUES(time_limit_minutes),
            time_limit_seconds = VALUES(time_limit_seconds),
            min_pass_score = VALUES(min_pass_score),
            updated_at = CURRENT_TIMESTAMP'
    );

    $stmt->execute([
        'id' => $payload['id'],
        'title' => $payload['title'],
        'time_limit_hours' => (int) ($payload['timeLimitHours'] ?? 0),
        'time_limit_minutes' => (int) ($payload['timeLimitMinutes'] ?? 0),
        'time_limit_seconds' => (int) ($payload['timeLimitSeconds'] ?? 0),
        'min_pass_score' => (int) ($payload['minPassScore'] ?? 0),
    ]);

    $deleteQuestions = $pdo->prepare('DELETE FROM test_questions WHERE test_id = :test_id');
    $deleteQuestions->execute(['test_id' => $payload['id']]);

    $questionStmt = $pdo->prepare(
        'INSERT INTO test_questions (
            id, test_id, question_text, question_type, options_json, correct_answer, points, sort_order
        ) VALUES (
            :id, :test_id, :question_text, :question_type, :options_json, :correct_answer, :points, :sort_order
        )'
    );

    foreach (($payload['questions'] ?? []) as $index => $question) {
        $questionStmt->execute([
            'id' => $question['id'] ?? new_id('q'),
            'test_id' => $payload['id'],
            'question_text' => $question['text'] ?? '',
            'question_type' => $question['type'] ?? 'TRUE_FALSE',
            'options_json' => isset($question['options']) ? json_encode($question['options'], JSON_UNESCAPED_UNICODE) : null,
            'correct_answer' => $question['correctAnswer'] ?? null,
            'points' => (int) ($question['points'] ?? 0),
            'sort_order' => $index + 1,
        ]);
    }
}

