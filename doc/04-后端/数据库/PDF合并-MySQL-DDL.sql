-- PDF Merge MVP MySQL DDL
-- Version: v1.0
-- Charset: utf8mb4
--
-- One-shot init (creates database + tables), from repo root, example:
--   mysql -u root -p < "doc/04-后端/数据库/PDF合并-MySQL-DDL.sql"
-- Windows CMD:
--   mysql -u root -p ^< "doc\04-后端\数据库\PDF合并-MySQL-DDL.sql"

CREATE DATABASE IF NOT EXISTS pdf_toolkit
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE pdf_toolkit;

CREATE TABLE IF NOT EXISTS merge_task (
    task_id              VARCHAR(36)  NOT NULL,
    owner_type           VARCHAR(16)  NOT NULL,
    owner_id             VARCHAR(64)  NOT NULL,
    status               VARCHAR(16)  NOT NULL,
    file_count           INT          NOT NULL,
    total_size_bytes     BIGINT       NOT NULL,
    result_file_path     VARCHAR(1024) NULL,
    result_file_name     VARCHAR(255)  NULL,
    result_size_bytes    BIGINT        NULL,
    error_code           VARCHAR(64)   NULL,
    error_message        VARCHAR(1024) NULL,
    retry_count          TINYINT      NOT NULL DEFAULT 0,
    version              INT          NOT NULL DEFAULT 0,
    created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    expired_at           TIMESTAMP(3) NULL,
    PRIMARY KEY (task_id),
    KEY idx_owner_status_created (owner_id, status, created_at),
    KEY idx_status_updated (status, updated_at),
    KEY idx_expired_at (expired_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS merge_task_file (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    task_id              VARCHAR(36)  NOT NULL,
    order_index          INT          NOT NULL,
    file_id              VARCHAR(36)  NOT NULL,
    origin_file_name     VARCHAR(255) NOT NULL,
    local_file_path      VARCHAR(1024) NOT NULL,
    size_bytes           BIGINT       NOT NULL,
    mime_type            VARCHAR(128) NULL,
    sha256               VARCHAR(64)  NULL,
    status               VARCHAR(24)  NOT NULL,
    error_code           VARCHAR(64)  NULL,
    error_message        VARCHAR(1024) NULL,
    created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_task_order (task_id, order_index),
    UNIQUE KEY uk_file_id (file_id),
    KEY idx_task_status (task_id, status),
    CONSTRAINT fk_merge_task_file_task_id FOREIGN KEY (task_id)
        REFERENCES merge_task (task_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS merge_download_token (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    token                VARCHAR(128) NOT NULL,
    task_id              VARCHAR(36)  NOT NULL,
    owner_id             VARCHAR(64)  NOT NULL,
    expire_at            TIMESTAMP(3) NOT NULL,
    used                 TINYINT      NOT NULL DEFAULT 0,
    created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    UNIQUE KEY uk_token (token),
    KEY idx_task_owner (task_id, owner_id),
    KEY idx_expire_used (expire_at, used),
    CONSTRAINT fk_merge_download_token_task_id FOREIGN KEY (task_id)
        REFERENCES merge_task (task_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Optional init status check values:
-- merge_task.status: DRAFT, QUEUED, PROCESSING, SUCCEEDED, FAILED, EXPIRED
-- merge_task_file.status: PENDING_UPLOAD, UPLOADING, READY, FAILED
