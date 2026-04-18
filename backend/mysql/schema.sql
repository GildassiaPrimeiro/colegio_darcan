CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'CANDIDATE') NOT NULL,
    avatar LONGTEXT NULL,
    linkedin VARCHAR(255) NULL,
    birth_date DATE NULL,
    gender VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    education TEXT NULL,
    experience TEXT NULL,
    interest_area VARCHAR(150) NULL,
    profile_complete TINYINT(1) NOT NULL DEFAULT 0,
    is_blocked TINYINT(1) NOT NULL DEFAULT 0,
    restrictions_json JSON NULL,
    document_status ENUM('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'NOT_SUBMITTED',
    is_online TINYINT(1) NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_documents (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    document_type ENUM('CV', 'BI', 'DIPLOMA') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url LONGTEXT NULL,
    status ENUM('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_document (user_id, document_type),
    CONSTRAINT fk_user_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tests (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    time_limit_hours INT NOT NULL DEFAULT 0,
    time_limit_minutes INT NOT NULL DEFAULT 0,
    time_limit_seconds INT NOT NULL DEFAULT 0,
    min_pass_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_questions (
    id VARCHAR(64) PRIMARY KEY,
    test_id VARCHAR(64) NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE', 'DISCURSIVE') NOT NULL,
    options_json JSON NULL,
    correct_answer TEXT NULL,
    points INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_questions_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    requirements_json JSON NOT NULL,
    status ENUM('OPEN', 'PAUSED', 'ARCHIVED') NOT NULL DEFAULT 'OPEN',
    created_at VARCHAR(40) NOT NULL,
    deadline DATE NULL,
    test_id VARCHAR(64) NULL,
    candidate_limit INT NOT NULL DEFAULT 1,
    test_date DATE NULL,
    test_time TIME NULL,
    min_experience VARCHAR(100) NULL,
    work_location VARCHAR(150) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_jobs_test FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS applications (
    id VARCHAR(64) PRIMARY KEY,
    job_id VARCHAR(64) NOT NULL,
    candidate_id VARCHAR(64) NOT NULL,
    status ENUM('PENDING_CV', 'PENDING_TEST', 'TEST_IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED_FOR_INTERVIEW', 'INTERVIEWED', 'REJECTED', 'HIRED') NOT NULL DEFAULT 'PENDING_CV',
    workflow_status VARCHAR(64) NOT NULL DEFAULT 'DOCUMENTOS_PENDENTES',
    applied_at VARCHAR(40) NOT NULL,
    cv_url LONGTEXT NOT NULL,
    test_scheduled_at VARCHAR(40) NULL,
    test_score DECIMAL(5,2) NULL,
    test_completed_at VARCHAR(40) NULL,
    interview_date VARCHAR(40) NULL,
    interview_location VARCHAR(255) NULL,
    interview_notes TEXT NULL,
    feedback TEXT NULL,
    blocked_until VARCHAR(40) NULL,
    evaluation_json JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_candidate_job (candidate_id, job_id),
    CONSTRAINT fk_applications_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_candidate FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('NEW_APPLICATION', 'TEST_COMPLETED', 'INFO', 'DOCS_ACCEPTED', 'DOCS_REJECTED', 'DOCS_MISSING', 'INTERVIEW_SCHEDULED', 'NEW_JOB', 'DOCS_SUBMITTED') NOT NULL DEFAULT 'INFO',
    target_user_id VARCHAR(64) NULL,
    sender_role ENUM('ADMIN', 'MANAGER', 'CANDIDATE') NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at VARCHAR(40) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    sender_id VARCHAR(64) NULL,
    sender_name VARCHAR(150) NOT NULL,
    sender_role ENUM('ADMIN', 'MANAGER', 'CANDIDATE') NULL,
    receiver_id VARCHAR(64) NULL,
    receiver_role ENUM('ADMIN', 'MANAGER', 'CANDIDATE') NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at VARCHAR(40) NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role ENUM('ADMIN', 'MANAGER', 'CANDIDATE') NULL,
    action_text VARCHAR(255) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS system_config (
    id TINYINT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    allow_new_registrations TINYINT(1) NOT NULL DEFAULT 1,
    audit_logs_enabled TINYINT(1) NOT NULL DEFAULT 1,
    notification_email VARCHAR(190) NOT NULL,
    enable_notifications TINYINT(1) NOT NULL DEFAULT 1,
    hero_images_json JSON NOT NULL,
    logo_url LONGTEXT NULL,
    about_us TEXT NULL,
    contact_phone VARCHAR(50) NULL,
    contact_whatsapp VARCHAR(50) NULL,
    social_facebook VARCHAR(255) NULL,
    social_instagram VARCHAR(255) NULL,
    overview_title VARCHAR(255) NULL,
    overview_subtitle VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
