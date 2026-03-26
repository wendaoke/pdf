# PDF工具集 - 数据库设计

## 1. 数据库选型

- **主数据库**: MySQL 8.0
- **缓存/队列**: Redis 7
- **搜索引擎**: Elasticsearch 8 (可选)
- **对象存储**: MinIO (文件内容)

## 2. 表结构设计

### 2.1 用户表 (users)

```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(50),
    avatar          VARCHAR(500),
    membership_type VARCHAR(20) DEFAULT 'free',
    membership_expires_at DATETIME,
    daily_quota     INT DEFAULT 3,
    max_file_size   INT DEFAULT 10,
    max_batch_size  INT DEFAULT 3,
    total_tasks     INT DEFAULT 0,
    total_files     INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'active',
    last_login_at   DATETIME,
    last_login_ip   VARCHAR(45),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_membership (membership_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.2 文件表 (files)

```sql
CREATE TABLE files (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED,
    task_id         BIGINT UNSIGNED,
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    size            BIGINT UNSIGNED NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    extension       VARCHAR(20),
    storage_bucket  VARCHAR(50) DEFAULT 'pdf-files',
    storage_path    VARCHAR(500) NOT NULL,
    page_count      INT,
    is_encrypted    BOOLEAN DEFAULT FALSE,
    metadata        JSON,
    status          VARCHAR(20) DEFAULT 'active',
    expires_at      DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_task_id (task_id),
    INDEX idx_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.3 任务表 (tasks)

```sql
CREATE TABLE tasks (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED,
    type            VARCHAR(50) NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending',
    priority        TINYINT DEFAULT 5,
    input_files     JSON NOT NULL,
    config          JSON NOT NULL,
    output_files    JSON,
    result_info     JSON,
    progress        TINYINT DEFAULT 0,
    progress_message VARCHAR(200),
    error_code      VARCHAR(50),
    error_message   TEXT,
    retry_count     TINYINT DEFAULT 0,
    max_retries     TINYINT DEFAULT 3,
    queued_at       DATETIME,
    started_at      DATETIME,
    completed_at    DATETIME,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_user_status (user_id, status),
    INDEX idx_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.4 订单表 (orders)

```sql
CREATE TABLE orders (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,
    order_no        VARCHAR(32) UNIQUE NOT NULL,
    type            VARCHAR(20) NOT NULL,
    membership_type VARCHAR(20) NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    original_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'pending',
    paid_at         DATETIME,
    membership_days INT NOT NULL,
    membership_starts_at DATETIME,
    membership_expires_at DATETIME,
    payment_channel VARCHAR(20),
    payment_no      VARCHAR(64),
    coupon_code     VARCHAR(50),
    remark          TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_order_no (order_no),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.5 支付记录表 (payments)

```sql
CREATE TABLE payments (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id        BIGINT UNSIGNED NOT NULL,
    channel         VARCHAR(20) NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    third_party_no  VARCHAR(64),
    third_party_data JSON,
    status          VARCHAR(20) DEFAULT 'pending',
    paid_at         DATETIME,
    error_code      VARCHAR(50),
    error_message   TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_id (order_id),
    INDEX idx_third_party (third_party_no),
    FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.6 系统配置表 (system_configs)

```sql
CREATE TABLE system_configs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    config_key      VARCHAR(100) UNIQUE NOT NULL,
    config_value    JSON NOT NULL,
    description     TEXT,
    updated_by      BIGINT UNSIGNED,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 3. 初始化数据

```sql
-- 会员配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('membership_limits', '{
    "free": {"daily_quota": 3, "max_file_size": 10, "max_batch_size": 3},
    "basic": {"daily_quota": 999999, "max_file_size": 50, "max_batch_size": 20},
    "premium": {"daily_quota": 999999, "max_file_size": 100, "max_batch_size": 50}
}', '会员等级限制配置');

-- 定价配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('pricing', '{
    "monthly": {"basic": 19.9, "premium": 49.9},
    "yearly": {"basic": 168, "premium": 399}
}', '定价配置');
```

---

*文档版本: v1.1 (MySQL版)*
*更新日期: 2026-03-22*
