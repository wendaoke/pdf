-- =============================================================================
-- PDF 合并相关库：增量升级脚本（已有库执行；新库请用 PDF合并-MySQL-DDL.sql 全量建表）
-- 文件：PDF合并-MySQL-UPDATE.sql
-- =============================================================================

USE pdf_toolkit;

-- -----------------------------------------------------------------------------
-- 1) merge_task：合并进度列（与 PDF合并-MySQL-DDL.sql 中新装库一致）
-- -----------------------------------------------------------------------------
ALTER TABLE merge_task
  ADD COLUMN merge_progress_index INT NULL COMMENT '当前正在处理的 order_index（1-based）',
  ADD COLUMN merge_progress_done INT NOT NULL DEFAULT 0 COMMENT '已并入输出的源文件数',
  ADD COLUMN merge_progress_name VARCHAR(255) NULL COMMENT '当前源原始文件名（冗余）';

-- -----------------------------------------------------------------------------
-- 2) user_feedback：用户意见反馈表
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_feedback (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    owner_id             VARCHAR(64)  NULL,
    contact              VARCHAR(128) NULL,
    category             VARCHAR(32)  NULL,
    content              TEXT         NOT NULL,
    context_json         JSON         NULL,
    status               VARCHAR(16)  NOT NULL DEFAULT 'NEW',
    created_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id),
    KEY idx_owner_created (owner_id, created_at),
    KEY idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
