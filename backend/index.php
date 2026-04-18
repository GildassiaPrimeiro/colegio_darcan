<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
$pdo = null;

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function audit(PDO $pdo, ?array $actor, string $action, string $module): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO audit_logs (id, user_id, user_name, user_role, action_text, module_name, ip_address)
         VALUES (:id, :user_id, :user_name, :user_role, :action_text, :module_name, :ip_address)'
    );
    $stmt->execute([
        'id' => new_id('log'),
        'user_id' => $actor['id'] ?? null,
        'user_name' => $actor['name'] ?? 'Sistema',
        'user_role' => $actor['role'] ?? null,
        'action_text' => $action,
        'module_name' => $module,
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
    ]);
}

function find_user_by_email(PDO $pdo, string $email, ?string $role = null): ?array
{
    if ($role !== null && $role !== '') {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND role = :role LIMIT 1');
        $stmt->execute(['email' => trim($email), 'role' => $role]);
    } else {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $stmt->execute(['email' => trim($email)]);
    }
    $user = $stmt->fetch();
    return $user ?: null;
}

function find_user_by_id(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function find_job_by_id(PDO $pdo, string $id): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM jobs WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $id]);
    $job = $stmt->fetch();
    return $job ?: null;
}

function count_job_applications(PDO $pdo, string $jobId): int
{
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM applications WHERE job_id = :job_id AND status <> 'REJECTED'");
    $stmt->execute(['job_id' => $jobId]);
    return (int) $stmt->fetchColumn();
}

function application_exists(PDO $pdo, string $jobId, string $candidateId): bool
{
    $stmt = $pdo->prepare('SELECT id FROM applications WHERE job_id = :job_id AND candidate_id = :candidate_id LIMIT 1');
    $stmt->execute([
        'job_id' => $jobId,
        'candidate_id' => $candidateId,
    ]);
    return (bool) $stmt->fetch();
}

function count_user_documents(PDO $pdo, string $userId): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM user_documents WHERE user_id = :user_id AND file_name IS NOT NULL AND file_name <> ""');
    $stmt->execute(['user_id' => $userId]);
    return (int) $stmt->fetchColumn();
}

function is_candidate_profile_complete(array $candidate): bool
{
    return !empty($candidate['name'])
        && !empty($candidate['email'])
        && !empty($candidate['phone'])
        && !empty($candidate['address'])
        && !empty($candidate['birth_date'])
        && !empty($candidate['gender'])
        && !empty($candidate['education'])
        && !empty($candidate['experience']);
}

function job_deadline_passed(array $job): bool
{
    if (empty($job['deadline'])) {
        return false;
    }

    $timezone = new DateTimeZone('Africa/Luanda');
    $deadline = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $job['deadline'] . ' 23:59:59', $timezone);
    if (!$deadline instanceof DateTimeImmutable) {
        return false;
    }

    return $deadline->getTimestamp() < time();
}

function sync_job_schedule_for_active_applications(PDO $pdo, string $jobId, ?string $testDate, ?string $testTime): void
{
    $scheduledAt = combine_test_datetime($testDate, $testTime);
    $stmt = $pdo->prepare(
        "UPDATE applications
         SET test_scheduled_at = :test_scheduled_at,
             updated_at = CURRENT_TIMESTAMP
         WHERE job_id = :job_id
           AND status IN ('PENDING_CV', 'PENDING_TEST', 'TEST_IN_PROGRESS')"
    );
    $stmt->execute([
        'job_id' => $jobId,
        'test_scheduled_at' => $scheduledAt,
    ]);
}

function notify_role(PDO $pdo, string $role, string $title, string $message, string $type = 'INFO', ?string $senderRole = null): void
{
    $stmt = $pdo->prepare('SELECT id FROM users WHERE role = :role');
    $stmt->execute(['role' => $role]);
    foreach ($stmt->fetchAll() as $row) {
        create_notification($pdo, $title, $message, $type, $row['id'], $senderRole);
    }
}

function update_user_presence(PDO $pdo, string $userId, bool $isOnline): void
{
    $stmt = $pdo->prepare(
        'UPDATE users
         SET is_online = :is_online,
             last_seen_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id'
    );
    $stmt->execute([
        'id' => $userId,
        'is_online' => $isOnline ? 1 : 0,
    ]);
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'];
$body = request_json();

try {
    if (!$pdo instanceof PDO) {
        bootstrap_database();
        $pdo = db();
    }

    if ($path === '/' || $path === '/index.php') {
        json_response([
            'ok' => true,
            'message' => 'API Darcan online',
            'state' => fetch_state($pdo),
        ]);
    }

    if ($path === '/api/state' && $method === 'GET') {
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/auth/login' && $method === 'POST') {
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        $user = find_user_by_email($pdo, $email);
        if (!$user) {
            json_response(['ok' => false, 'message' => 'Utilizador nao encontrado.'], 404);
        }
        if ((bool) $user['is_blocked']) {
            json_response(['ok' => false, 'message' => 'Conta bloqueada.'], 403);
        }
        if (!password_verify($password, $user['password_hash'])) {
            json_response(['ok' => false, 'message' => 'Credenciais invalidas.'], 401);
        }

        update_user_presence($pdo, $user['id'], true);
        audit($pdo, $user, 'Inicio de sessao', 'Auth');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/auth/logout' && $method === 'POST') {
        $userId = (string) ($body['userId'] ?? '');
        if ($userId !== '') {
            update_user_presence($pdo, $userId, false);
        }
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/auth/register' && $method === 'POST') {
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $role = trim((string) ($body['role'] ?? 'CANDIDATE'));
        $password = (string) ($body['password'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            json_response(['ok' => false, 'message' => 'Nome, email e password sao obrigatorios.'], 422);
        }

        $config = fetch_system_config($pdo);
        if (($config['allowNewRegistrations'] ?? false) !== true && $role === 'CANDIDATE') {
            json_response(['ok' => false, 'message' => 'Novos registos estao desativados.'], 403);
        }

        $exists = $pdo->prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $exists->execute(['email' => $email]);
        if ($exists->fetch()) {
            json_response(['ok' => false, 'message' => 'Ja existe uma conta com este email.'], 409);
        }

        $id = new_id($role === 'ADMIN' ? 'admin' : 'cand');
        $stmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password_hash, role, restrictions_json, document_status, profile_complete, is_blocked)
             VALUES (:id, :name, :email, :password_hash, :role, :restrictions_json, :document_status, 0, 0)'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_BCRYPT),
            'role' => $role,
            'restrictions_json' => $role === 'MANAGER' ? json_encode(['disabledModules' => []]) : null,
            'document_status' => 'NOT_SUBMITTED',
        ]);

        $actor = ['id' => $id, 'name' => $name, 'role' => $role];
        audit($pdo, $actor, 'Registo de conta', 'Auth');
        json_response(['ok' => true, 'data' => fetch_state($pdo)], 201);
    }

    if ($path === '/api/jobs' && $method === 'POST') {
        $id = $body['id'] ?? new_id('job');
        $stmt = $pdo->prepare(
            'INSERT INTO jobs (id, title, department, description, requirements_json, status, created_at, deadline, test_id, candidate_limit, test_date, test_time, min_experience, work_location)
             VALUES (:id, :title, :department, :description, :requirements_json, :status, :created_at, :deadline, :test_id, :candidate_limit, :test_date, :test_time, :min_experience, :work_location)
             ON DUPLICATE KEY UPDATE
                title = VALUES(title),
                department = VALUES(department),
                description = VALUES(description),
                requirements_json = VALUES(requirements_json),
                status = VALUES(status),
                deadline = VALUES(deadline),
                test_id = VALUES(test_id),
                candidate_limit = VALUES(candidate_limit),
                test_date = VALUES(test_date),
                test_time = VALUES(test_time),
                min_experience = VALUES(min_experience),
                work_location = VALUES(work_location),
                updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'id' => $id,
            'title' => $body['title'] ?? '',
            'department' => $body['department'] ?? '',
            'description' => $body['description'] ?? '',
            'requirements_json' => json_encode($body['requirements'] ?? [], JSON_UNESCAPED_UNICODE),
            'status' => $body['status'] ?? 'OPEN',
            'created_at' => $body['createdAt'] ?? now_iso(),
            'deadline' => $body['deadline'] ?? null,
            'test_id' => $body['testId'] ?? null,
            'candidate_limit' => max(1, (int) ($body['candidateLimit'] ?? 1)),
            'test_date' => $body['testDate'] ?? null,
            'test_time' => $body['testTime'] ?? null,
            'min_experience' => $body['minExperience'] ?? null,
            'work_location' => $body['workLocation'] ?? null,
        ]);
        sync_job_schedule_for_active_applications($pdo, $id, $body['testDate'] ?? null, $body['testTime'] ?? null);
        audit($pdo, null, 'Vaga guardada: ' . ($body['title'] ?? $id), 'Jobs');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/jobs/([^/]+)$#', $path, $matches)) {
        $jobId = $matches[1];
        if ($method === 'PUT' || $method === 'PATCH') {
            $stmt = $pdo->prepare(
                'UPDATE jobs SET
                    title = COALESCE(:title, title),
                    department = COALESCE(:department, department),
                    description = COALESCE(:description, description),
                    requirements_json = COALESCE(:requirements_json, requirements_json),
                    status = COALESCE(:status, status),
                    deadline = COALESCE(:deadline, deadline),
                    test_id = COALESCE(:test_id, test_id),
                    candidate_limit = COALESCE(:candidate_limit, candidate_limit),
                    test_date = COALESCE(:test_date, test_date),
                    test_time = COALESCE(:test_time, test_time),
                    min_experience = COALESCE(:min_experience, min_experience),
                    work_location = COALESCE(:work_location, work_location),
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $stmt->execute([
                'id' => $jobId,
                'title' => $body['title'] ?? null,
                'department' => $body['department'] ?? null,
                'description' => $body['description'] ?? null,
                'requirements_json' => array_key_exists('requirements', $body) ? json_encode($body['requirements'], JSON_UNESCAPED_UNICODE) : null,
                'status' => $body['status'] ?? null,
                'deadline' => $body['deadline'] ?? null,
                'test_id' => array_key_exists('testId', $body) ? $body['testId'] : null,
                'candidate_limit' => array_key_exists('candidateLimit', $body) ? max(1, (int) $body['candidateLimit']) : null,
                'test_date' => array_key_exists('testDate', $body) ? $body['testDate'] : null,
                'test_time' => array_key_exists('testTime', $body) ? $body['testTime'] : null,
                'min_experience' => $body['minExperience'] ?? null,
                'work_location' => $body['workLocation'] ?? null,
            ]);
            $updatedJob = find_job_by_id($pdo, $jobId);
            sync_job_schedule_for_active_applications(
                $pdo,
                $jobId,
                $updatedJob['test_date'] ?? null,
                $updatedJob['test_time'] ?? null
            );
            audit($pdo, null, 'Vaga atualizada: ' . $jobId, 'Jobs');
            json_response(['ok' => true, 'data' => fetch_state($pdo)]);
        }

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM jobs WHERE id = :id')->execute(['id' => $jobId]);
            audit($pdo, null, 'Vaga removida: ' . $jobId, 'Jobs');
            json_response(['ok' => true, 'data' => fetch_state($pdo)]);
        }
    }

    if ($path === '/api/tests' && $method === 'POST') {
        upsert_test($pdo, $body);
        audit($pdo, null, 'Teste guardado: ' . ($body['title'] ?? $body['id'] ?? ''), 'Tests');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/tests/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $testId = $matches[1];
        $pdo->prepare('DELETE FROM tests WHERE id = :id')->execute(['id' => $testId]);
        audit($pdo, null, 'Teste removido: ' . $testId, 'Tests');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/applications' && $method === 'POST') {
        $candidateId = (string) ($body['candidateId'] ?? '');
        $jobId = (string) ($body['jobId'] ?? '');
        $candidate = find_user_by_id($pdo, $candidateId);
        $job = find_job_by_id($pdo, $jobId);

        if (!$candidate || !$job) {
            json_response(['ok' => false, 'message' => 'Candidato ou vaga não encontrados.'], 404);
        }
        if (($job['status'] ?? '') !== 'OPEN') {
            json_response(['ok' => false, 'message' => 'Esta vaga não está disponível para novas candidaturas.'], 409);
        }
        if (job_deadline_passed($job)) {
            json_response(['ok' => false, 'message' => 'O prazo de inscrição desta vaga já terminou.'], 409);
        }
        $profileComplete = is_candidate_profile_complete($candidate);
        if ((bool) ($candidate['profile_complete'] ?? false) !== $profileComplete) {
            $syncProfileStmt = $pdo->prepare(
                'UPDATE users
                 SET profile_complete = :profile_complete,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = :id'
            );
            $syncProfileStmt->execute([
                'id' => $candidateId,
                'profile_complete' => $profileComplete ? 1 : 0,
            ]);
        }

        if (!$profileComplete) {
            json_response(['ok' => false, 'message' => 'Complete o perfil antes de se candidatar.'], 422);
        }
        if (count_user_documents($pdo, $candidateId) < 3) {
            json_response(['ok' => false, 'message' => 'Submeta CV, BI e Certificado/Diploma antes de se candidatar.'], 422);
        }
        if (($candidate['document_status'] ?? '') !== 'APPROVED') {
            json_response(['ok' => false, 'message' => 'Aguarde a aprovação do perfil e dos documentos pelo gestor ou administrador antes de se candidatar.'], 422);
        }
        if (application_exists($pdo, $jobId, $candidateId)) {
            json_response(['ok' => false, 'message' => 'Já existe uma candidatura deste candidato para esta vaga.'], 409);
        }

        $limit = max(1, (int) ($job['candidate_limit'] ?? 1));
        if (count_job_applications($pdo, $jobId) >= $limit) {
            json_response(['ok' => false, 'message' => 'A vaga já atingiu o limite máximo de candidatos.'], 409);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO applications (id, job_id, candidate_id, status, workflow_status, applied_at, cv_url, test_scheduled_at)
             VALUES (:id, :job_id, :candidate_id, :status, :workflow_status, :applied_at, :cv_url, :test_scheduled_at)'
        );
        $stmt->execute([
            'id' => $body['id'] ?? new_id('app'),
            'job_id' => $jobId,
            'candidate_id' => $candidateId,
            'status' => $body['status'] ?? 'PENDING_CV',
            'workflow_status' => ($candidate['document_status'] ?? '') === 'APPROVED' ? 'DOCUMENTOS_APROVADOS' : 'DOCUMENTOS_PENDENTES',
            'applied_at' => $body['appliedAt'] ?? now_iso(),
            'cv_url' => $body['cvUrl'] ?? '',
            'test_scheduled_at' => combine_test_datetime($job['test_date'] ?? null, $job['test_time'] ?? null),
        ]);
        notify_role($pdo, 'MANAGER', 'Novo candidato submetido', sprintf('Novo candidato submetido para a vaga %s.', $job['title']), 'NEW_APPLICATION', 'CANDIDATE');
        audit($pdo, null, 'Candidatura criada', 'Applications');
        json_response(['ok' => true, 'data' => fetch_state($pdo)], 201);
    }

    if (preg_match('#^/api/applications/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $applicationId = $matches[1];
        $pdo->prepare('DELETE FROM applications WHERE id = :id')->execute(['id' => $applicationId]);
        audit($pdo, null, 'Candidatura removida: ' . $applicationId, 'Applications');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/applications/([^/]+)/document-status$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $applicationId = $matches[1];
        $status = (string) ($body['status'] ?? '');
        $applicationStmt = $pdo->prepare('SELECT * FROM applications WHERE id = :id LIMIT 1');
        $applicationStmt->execute(['id' => $applicationId]);
        $application = $applicationStmt->fetch();

        if (!$application) {
            json_response(['ok' => false, 'message' => 'Candidatura não encontrada.'], 404);
        }

        $workflowStatus = $status === 'APPROVED' ? 'DOCUMENTOS_APROVADOS' : 'DOCUMENTOS_REJEITADOS';
        if (($application['workflow_status'] ?? '') === $workflowStatus) {
            json_response(['ok' => false, 'message' => $status === 'APPROVED' ? 'Esta candidatura já teve os documentos aprovados.' : 'Esta candidatura já teve os documentos reprovados.'], 409);
        }
        $pdo->prepare('UPDATE applications SET workflow_status = :workflow_status, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute([
                'id' => $applicationId,
                'workflow_status' => $workflowStatus,
            ]);

        create_notification(
            $pdo,
            $status === 'APPROVED' ? 'Documentos validados' : 'Documentos rejeitados',
            $status === 'APPROVED'
                ? 'Os seus documentos foram validados para esta candidatura. Aguarde os próximos passos.'
                : 'Os seus documentos foram rejeitados para esta candidatura. Revise os ficheiros e submeta novamente se necessário.',
            $status === 'APPROVED' ? 'DOCS_ACCEPTED' : 'DOCS_REJECTED',
            $application['candidate_id'],
            'MANAGER'
        );

        audit($pdo, null, 'Estado documental da candidatura atualizado: ' . $applicationId, 'Applications');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/applications/([^/]+)/status$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $applicationId = $matches[1];
        $applicationStmt = $pdo->prepare('SELECT * FROM applications WHERE id = :id LIMIT 1');
        $applicationStmt->execute(['id' => $applicationId]);
        $application = $applicationStmt->fetch();
        if (!$application) {
            json_response(['ok' => false, 'message' => 'Candidatura não encontrada.'], 404);
        }
        $job = find_job_by_id($pdo, $application['job_id']);
        $status = $body['status'] ?? 'PENDING_CV';
        $workflowStatus = $application['workflow_status'] ?? 'DOCUMENTOS_PENDENTES';
        $scheduledAt = combine_test_datetime($job['test_date'] ?? null, $job['test_time'] ?? null) ?: $application['test_scheduled_at'];

        if ($status === 'PENDING_TEST') {
            if (!$job || empty($job['test_id'])) {
                json_response(['ok' => false, 'message' => 'Associe um teste online a esta vaga antes de o enviar ao candidato.'], 422);
            }
            if (!$scheduledAt) {
                json_response(['ok' => false, 'message' => 'Defina a data e a hora do teste na vaga antes de enviar o teste ao candidato.'], 422);
            }
            $workflowStatus = strtotime((string) $scheduledAt) <= time() ? 'TESTE_DISPONIVEL' : 'SELECIONADO_PARA_TESTE';
            create_notification(
                $pdo,
                'Selecionado para teste',
                sprintf('Foi selecionado para um teste. Data: %s, Hora: %s', $job['test_date'] ?? '-', $job['test_time'] ?? '-'),
                'INFO',
                $application['candidate_id'],
                'MANAGER'
            );
        } elseif ($status === 'PENDING_REVIEW') {
            $workflowStatus = 'TESTE_REALIZADO';
        } elseif ($status === 'HIRED') {
            $workflowStatus = 'APROVADO';
        } elseif ($status === 'REJECTED') {
            $workflowStatus = 'REPROVADO';
        } elseif ($status === 'APPROVED_FOR_INTERVIEW') {
            $workflowStatus = 'APROVADO';
        }

        $stmt = $pdo->prepare(
            'UPDATE applications SET
                status = :status,
                workflow_status = :workflow_status,
                test_scheduled_at = :test_scheduled_at,
                test_score = :test_score,
                test_completed_at = :test_completed_at,
                interview_date = :interview_date,
                interview_location = :interview_location,
                interview_notes = :interview_notes,
                feedback = :feedback,
                blocked_until = :blocked_until,
                evaluation_json = :evaluation_json,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $applicationId,
            'status' => $status,
            'workflow_status' => $workflowStatus,
            'test_scheduled_at' => $scheduledAt,
            'test_score' => $body['testScore'] ?? null,
            'test_completed_at' => $body['testCompletedAt'] ?? null,
            'interview_date' => $body['interviewDate'] ?? null,
            'interview_location' => $body['interviewLocation'] ?? null,
            'interview_notes' => $body['interviewNotes'] ?? null,
            'feedback' => $body['feedback'] ?? null,
            'blocked_until' => $body['blockedUntil'] ?? null,
            'evaluation_json' => isset($body['evaluation']) ? json_encode($body['evaluation'], JSON_UNESCAPED_UNICODE) : null,
        ]);
        audit($pdo, null, 'Estado da candidatura atualizado: ' . $matches[1], 'Applications');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/users/([^/]+)/profile$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $existingUser = find_user_by_id($pdo, $matches[1]);
        if (!$existingUser) {
            json_response(['ok' => false, 'message' => 'Utilizador não encontrado.'], 404);
        }

        $resolvedName = $body['name'] ?? $existingUser['name'] ?? null;
        $resolvedEmail = $body['email'] ?? $existingUser['email'] ?? null;
        $resolvedPhone = $body['phone'] ?? $existingUser['phone'] ?? null;
        $resolvedAddress = $body['address'] ?? $existingUser['address'] ?? null;
        $resolvedBirthDate = $body['birthDate'] ?? $existingUser['birth_date'] ?? null;
        $resolvedGender = $body['gender'] ?? $existingUser['gender'] ?? null;
        $resolvedEducation = $body['education'] ?? $existingUser['education'] ?? null;
        $resolvedExperience = $body['experience'] ?? $existingUser['experience'] ?? null;

        $profileComplete = !empty($resolvedName)
            && !empty($resolvedEmail)
            && !empty($resolvedPhone)
            && !empty($resolvedAddress)
            && !empty($resolvedBirthDate)
            && !empty($resolvedGender)
            && !empty($resolvedEducation)
            && !empty($resolvedExperience);
        $stmt = $pdo->prepare(
            'UPDATE users SET
                name = COALESCE(:name, name),
                email = COALESCE(:email, email),
                avatar = COALESCE(:avatar, avatar),
                birth_date = COALESCE(:birth_date, birth_date),
                gender = COALESCE(:gender, gender),
                address = COALESCE(:address, address),
                phone = COALESCE(:phone, phone),
                education = COALESCE(:education, education),
                experience = COALESCE(:experience, experience),
                interest_area = COALESCE(:interest_area, interest_area),
                linkedin = COALESCE(:linkedin, linkedin),
                profile_complete = :profile_complete,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $matches[1],
            'name' => $body['name'] ?? null,
            'email' => $body['email'] ?? null,
            'avatar' => $body['avatar'] ?? null,
            'birth_date' => $body['birthDate'] ?? null,
            'gender' => $body['gender'] ?? null,
            'address' => $body['address'] ?? null,
            'phone' => $body['phone'] ?? null,
            'education' => $body['education'] ?? null,
            'experience' => $body['experience'] ?? null,
            'interest_area' => $body['interestArea'] ?? null,
            'linkedin' => $body['linkedin'] ?? null,
            'profile_complete' => $profileComplete ? 1 : 0,
        ]);
        audit($pdo, null, 'Perfil atualizado: ' . $matches[1], 'Profile');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/users/([^/]+)/documents$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $userId = $matches[1];
        $documents = [
            'CV' => ['name' => $body['cvName'] ?? null, 'url' => $body['cvUrl'] ?? null],
            'BI' => ['name' => $body['biName'] ?? null, 'url' => $body['biUrl'] ?? null],
            'DIPLOMA' => ['name' => $body['diplomaName'] ?? null, 'url' => $body['diplomaUrl'] ?? null],
        ];

        $findDocumentStmt = $pdo->prepare(
            'SELECT id, file_url
             FROM user_documents
             WHERE user_id = :user_id AND document_type = :document_type
             ORDER BY updated_at DESC, created_at DESC, id DESC
             LIMIT 1'
        );
        $insertDocumentStmt = $pdo->prepare(
            'INSERT INTO user_documents (id, user_id, document_type, file_name, file_url, status, submitted_at)
             VALUES (:id, :user_id, :document_type, :file_name, :file_url, :status, NOW())'
        );
        $updateDocumentStmt = $pdo->prepare(
            'UPDATE user_documents
             SET file_name = :file_name,
                 file_url = :file_url,
                 status = :status,
                 submitted_at = NOW(),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );

        foreach ($documents as $type => $document) {
            $fileName = $document['name'] ?? null;
            if ($fileName === null || $fileName === '') {
                continue;
            }

            $findDocumentStmt->execute([
                'user_id' => $userId,
                'document_type' => $type,
            ]);
            $existingDocument = $findDocumentStmt->fetch();
            $resolvedFileUrl = $document['url'] ?? ($existingDocument['file_url'] ?? null);

            if ($existingDocument) {
                $updateDocumentStmt->execute([
                    'id' => $existingDocument['id'],
                    'file_name' => $fileName,
                    'file_url' => $resolvedFileUrl,
                    'status' => 'SUBMITTED',
                ]);
                continue;
            }

            $insertDocumentStmt->execute([
                'id' => new_id('doc'),
                'user_id' => $userId,
                'document_type' => $type,
                'file_name' => $fileName,
                'file_url' => $resolvedFileUrl,
                'status' => 'SUBMITTED',
            ]);
        }

        $pdo->prepare('UPDATE users SET document_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute(['status' => 'SUBMITTED', 'id' => $userId]);

        $candidate = find_user_by_id($pdo, $userId);
        $candidateName = $candidate['name'] ?? $userId;
        notify_role($pdo, 'MANAGER', 'Documentos submetidos', sprintf('O candidato %s submeteu perfil e documentos para validação.', $candidateName), 'DOCS_SUBMITTED', 'CANDIDATE');
        notify_role($pdo, 'ADMIN', 'Documentos submetidos', sprintf('O candidato %s submeteu perfil e documentos para validação.', $candidateName), 'DOCS_SUBMITTED', 'CANDIDATE');
        audit($pdo, null, 'Documentos submetidos: ' . $userId, 'Documents');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/users/([^/]+)/document-status$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $userId = $matches[1];
        $status = (string) ($body['status'] ?? '');
        $documentCount = count_user_documents($pdo, $userId);
        $currentUser = find_user_by_id($pdo, $userId);

        if ($status === 'APPROVED' && $documentCount < 3) {
            json_response(['ok' => false, 'message' => 'É necessário validar CV, BI e Certificado/Diploma antes da aprovação.'], 422);
        }

        if (($currentUser['document_status'] ?? '') === $status) {
            json_response(['ok' => false, 'message' => $status === 'APPROVED' ? 'Este perfil já foi aprovado.' : 'Este perfil já foi reprovado.'], 409);
        }

        $pdo->prepare('UPDATE user_documents SET status = :status, reviewed_at = NOW(), updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id')
            ->execute([
                'status' => $status === 'APPROVED' ? 'APPROVED' : ($status === 'REJECTED' ? 'REJECTED' : 'SUBMITTED'),
                'user_id' => $userId,
            ]);

        $pdo->prepare('UPDATE users SET document_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute(['status' => $status, 'id' => $userId]);

        if ($status === 'APPROVED') {
            create_notification(
                $pdo,
                'Documentos aprovados',
                'Os seus documentos foram aprovados. Já pode candidatar-se às vagas disponíveis.',
                'DOCS_ACCEPTED',
                $userId,
                'MANAGER'
            );
        }
        audit($pdo, null, 'Estado documental atualizado: ' . $matches[1], 'Documents');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/candidates/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $candidateId = $matches[1];
        $pdo->prepare('DELETE FROM users WHERE id = :id AND role = "CANDIDATE"')
            ->execute(['id' => $candidateId]);
        audit($pdo, null, 'Candidato removido: ' . $candidateId, 'Candidates');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/messages' && $method === 'POST') {
        $stmt = $pdo->prepare(
            'INSERT INTO messages (id, sender_id, sender_name, sender_role, receiver_id, receiver_role, subject, content, created_at, is_read)
             VALUES (:id, :sender_id, :sender_name, :sender_role, :receiver_id, :receiver_role, :subject, :content, :created_at, 0)'
        );
        $stmt->execute([
            'id' => $body['id'] ?? new_id('msg'),
            'sender_id' => $body['senderId'] ?? null,
            'sender_name' => $body['senderName'] ?? 'Sistema',
            'sender_role' => $body['senderRole'] ?? null,
            'receiver_id' => $body['receiverId'] ?? null,
            'receiver_role' => $body['receiverRole'] ?? null,
            'subject' => $body['subject'] ?? '',
            'content' => $body['content'] ?? '',
            'created_at' => $body['timestamp'] ?? now_iso(),
        ]);
        audit($pdo, null, 'Mensagem enviada', 'Messages');
        json_response(['ok' => true, 'data' => fetch_state($pdo)], 201);
    }

    if ($path === '/api/notifications' && $method === 'POST') {
        $stmt = $pdo->prepare(
            'INSERT INTO notifications (id, title, message, type, target_user_id, sender_role, created_at, is_read)
             VALUES (:id, :title, :message, :type, :target_user_id, :sender_role, :created_at, 0)'
        );
        $stmt->execute([
            'id' => $body['id'] ?? new_id('notif'),
            'title' => $body['title'] ?? '',
            'message' => $body['message'] ?? '',
            'type' => $body['type'] ?? 'INFO',
            'target_user_id' => $body['targetUserId'] ?? null,
            'sender_role' => $body['senderRole'] ?? null,
            'created_at' => $body['timestamp'] ?? now_iso(),
        ]);
        json_response(['ok' => true, 'data' => fetch_state($pdo)], 201);
    }

    if (preg_match('#^/api/notifications/([^/]+)/read$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $pdo->prepare('UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE id = :id')
            ->execute(['id' => $matches[1]]);
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/notifications/read-all' && ($method === 'PUT' || $method === 'PATCH')) {
        $targetUserId = $body['targetUserId'] ?? null;
        if ($targetUserId) {
            $pdo->prepare('UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP WHERE target_user_id = :target_user_id')
                ->execute(['target_user_id' => $targetUserId]);
        } else {
            $pdo->exec('UPDATE notifications SET is_read = 1, updated_at = CURRENT_TIMESTAMP');
        }
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/system-config' && ($method === 'PUT' || $method === 'PATCH')) {
        $stmt = $pdo->prepare(
            'UPDATE system_config SET
                company_name = :company_name,
                allow_new_registrations = :allow_new_registrations,
                audit_logs_enabled = :audit_logs_enabled,
                notification_email = :notification_email,
                enable_notifications = :enable_notifications,
                hero_images_json = :hero_images_json,
                logo_url = :logo_url,
                about_us = :about_us,
                contact_phone = :contact_phone,
                contact_whatsapp = :contact_whatsapp,
                social_facebook = :social_facebook,
                social_instagram = :social_instagram,
                overview_title = :overview_title,
                overview_subtitle = :overview_subtitle,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = 1'
        );
        $stmt->execute([
            'company_name' => $body['companyName'] ?? 'Darcan',
            'allow_new_registrations' => !empty($body['allowNewRegistrations']) ? 1 : 0,
            'audit_logs_enabled' => !empty($body['auditLogsEnabled']) ? 1 : 0,
            'notification_email' => $body['notificationEmail'] ?? '',
            'enable_notifications' => !empty($body['enableNotifications']) ? 1 : 0,
            'hero_images_json' => json_encode($body['heroImages'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'logo_url' => $body['logoUrl'] ?? '',
            'about_us' => $body['aboutUs'] ?? '',
            'contact_phone' => $body['contactPhone'] ?? '',
            'contact_whatsapp' => $body['contactWhatsapp'] ?? '',
            'social_facebook' => $body['socialFacebook'] ?? '',
            'social_instagram' => $body['socialInstagram'] ?? '',
            'overview_title' => $body['overviewTitle'] ?? '',
            'overview_subtitle' => $body['overviewSubtitle'] ?? '',
        ]);
        audit($pdo, null, 'Configuracao do sistema atualizada', 'Settings');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if ($path === '/api/managers' && $method === 'POST') {
        $id = $body['id'] ?? new_id('mgr');
        $stmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password_hash, role, restrictions_json, document_status, profile_complete, is_blocked)
             VALUES (:id, :name, :email, :password_hash, :role, :restrictions_json, :document_status, 0, 0)'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $body['name'] ?? '',
            'email' => $body['email'] ?? '',
            'password_hash' => password_hash((string) ($body['password'] ?? '12345678'), PASSWORD_BCRYPT),
            'role' => 'MANAGER',
            'restrictions_json' => json_encode(['disabledModules' => []]),
            'document_status' => 'NOT_SUBMITTED',
        ]);
        audit($pdo, null, 'Gestor criado: ' . ($body['email'] ?? $id), 'Admin');
        json_response(['ok' => true, 'data' => fetch_state($pdo)], 201);
    }

    if (preg_match('#^/api/managers/([^/]+)/permissions$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $pdo->prepare('UPDATE users SET restrictions_json = :restrictions_json, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = "MANAGER"')
            ->execute([
                'id' => $matches[1],
                'restrictions_json' => json_encode($body, JSON_UNESCAPED_UNICODE),
            ]);
        audit($pdo, null, 'Permissoes do gestor atualizadas: ' . $matches[1], 'Admin');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/managers/([^/]+)/block$#', $path, $matches) && ($method === 'PUT' || $method === 'PATCH')) {
        $pdo->prepare('UPDATE users SET is_blocked = :is_blocked, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND role = "MANAGER"')
            ->execute([
                'id' => $matches[1],
                'is_blocked' => !empty($body['isBlocked']) ? 1 : 0,
            ]);
        audit($pdo, null, 'Bloqueio de gestor atualizado: ' . $matches[1], 'Admin');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    if (preg_match('#^/api/managers/([^/]+)$#', $path, $matches) && $method === 'DELETE') {
        $pdo->prepare('DELETE FROM users WHERE id = :id AND role = "MANAGER"')
            ->execute(['id' => $matches[1]]);
        audit($pdo, null, 'Gestor removido: ' . $matches[1], 'Admin');
        json_response(['ok' => true, 'data' => fetch_state($pdo)]);
    }

    json_response(['ok' => false, 'message' => 'Rota nao encontrada.'], 404);
} catch (Throwable $exception) {
    json_response([
        'ok' => false,
        'message' => $exception->getMessage(),
    ], 503);
}
