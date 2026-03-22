# PDF工具集 - 数据库设计

## 1. 数据库选型

- **主数据库**: MySQL 8.0
- **缓存/队列**: Redis 7
- **搜索引擎**: Elasticsearch 8
- **对象存储**: MinIO (文件内容)

## 2. 实体关系图 (ER Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              数据库实体关系图                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │    users     │         │   files      │         │   tasks      │            │
│  │   (用户表)    │         │   (文件表)   │         │   (任务表)   │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ id (PK)      │         │ id (PK)      │         │ id (PK)      │            │
│  │ email        │         │ user_id (FK) │◄────────│ user_id (FK) │            │
│  │ phone        │         │ task_id (FK) │◄────────│ file_id (FK) │            │
│  │ password_hash│         │ filename     │         │ type         │            │
│  │ nickname     │         │ original_name│         │ status       │            │
│  │ avatar       │         │ size         │         │ config       │            │
│  │ membership   │         │ mime_type    │         │ result       │            │
│  │ quota        │         │ storage_path │         │ progress     │            │
│  │ created_at   │         │ status       │         │ error_msg    │            │
│  └──────────────┘         │ expires_at   │         │ started_at   │            │
│         │                 │ created_at   │         │ completed_at │            │
│         │                 └──────────────┘         │ created_at   │            │
│         │                      │                   └──────────────┘            │
│         │                      │                          │                    │
│         │                      │                          │                    │
│         ▼                      ▼                          ▼                    │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│  │   orders     │         │  user_stats  │         │   payments   │            │
│  │   (订单表)    │         │ (用户统计表) │         │   (支付表)   │            │
│  ├──────────────┤         ├──────────────┤         ├──────────────┤            │
│  │ id (PK)      │         │ user_id (PK) │         │ id (PK)      │            │
│  │ user_id (FK) │◄────────│ total_tasks  │         │ order_id (FK)│            │
│  │ type         │         │ total_files  │         │ channel      │            │
│  │ amount       │         │ total_size   │         │ amount       │            │
│  │ status       │         │ last_active  │         │ status       │            │
│  │ expires_at   │         │ updated_at   │         │ paid_at      │            │
│  │ created_at   │         └──────────────┘         │ created_at   │            │
│  └──────────────┘                                  └──────────────┘            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 3. 表结构设计

### 3.1 用户表 (users)

```sql
CREATE TABLE `users` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email`             VARCHAR(255) UNIQUE,
    `phone`             VARCHAR(20) UNIQUE,
    `password_hash`     VARCHAR(255) NOT NULL,
    `nickname`          VARCHAR(50),
    `avatar`            VARCHAR(500),
    
    -- 会员信息
    `membership_type`   VARCHAR(20) DEFAULT 'free', -- free, basic, premium
    `membership_expires_at` DATETIME,
    
    -- 使用配额
    `daily_quota`       INT DEFAULT 3,          -- 每日转换次数
    `max_file_size`     INT DEFAULT 10,         -- MB
    `max_batch_size`    INT DEFAULT 3,          -- 批量处理数量
    
    -- 统计
    `total_tasks`       INT DEFAULT 0,
    `total_files`       INT DEFAULT 0,
    
    -- 状态
    `status`            VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    `last_login_at`     DATETIME,
    `last_login_ip`     VARCHAR(45),
    
    -- 时间戳
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        DATETIME,                   -- 软删除
    
    INDEX `idx_email` (`email`),
    INDEX `idx_phone` (`phone`),
    INDEX `idx_membership` (`membership_type`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 文件表 (files)

```sql
CREATE TABLE `files` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`           BIGINT UNSIGNED,
    `task_id`           BIGINT UNSIGNED,        -- 关联任务ID
    
    -- 文件信息
    `filename`          VARCHAR(255) NOT NULL,  -- 存储文件名(UUID)
    `original_name`     VARCHAR(255) NOT NULL,  -- 原始文件名
    `size`              BIGINT UNSIGNED NOT NULL, -- 字节
    `mime_type`         VARCHAR(100) NOT NULL,
    `extension`         VARCHAR(20),
    
    -- 存储路径
    `storage_bucket`    VARCHAR(50) DEFAULT 'pdf-files',
    `storage_path`      VARCHAR(500) NOT NULL,  -- 对象存储路径
    `storage_endpoint`  VARCHAR(200),           -- 存储端点
    
    -- 文件元数据
    `page_count`        INT,                    -- PDF页数
    `is_encrypted`      TINYINT(1) DEFAULT 0,   -- 是否加密
    `metadata`          JSON,                   -- 其他元数据
    
    -- 状态
    `status`            VARCHAR(20) DEFAULT 'active', -- active, processing, deleted
    `expires_at`        DATETIME,               -- 自动删除时间
    
    -- 时间戳
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        DATETIME,
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_expires` (`expires_at`),
    INDEX `idx_status` (`status`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 任务表 (tasks)

```sql
CREATE TABLE `tasks` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`           BIGINT UNSIGNED,
    
    -- 任务信息
    `type`              VARCHAR(50) NOT NULL,   -- pdf_to_word, pdf_merge, etc.
    `status`            VARCHAR(20) DEFAULT 'pending', -- pending, queued, processing, completed, failed, cancelled
    `priority`          INT DEFAULT 5,          -- 1-10, 数字越小优先级越高
    
    -- 输入文件
    `input_files`       JSON NOT NULL,          -- [{file_id, filename, size, page_count}]
    
    -- 任务配置
    `config`            JSON NOT NULL,          -- 转换配置参数
    
    -- 输出结果
    `output_files`      JSON,                   -- [{file_id, filename, size, download_url}]
    `result_info`       JSON,                   -- 转换结果信息(页数、压缩率等)
    
    -- 进度
    `progress`          INT DEFAULT 0,          -- 0-100
    `progress_message`  VARCHAR(200),           -- 当前步骤描述
    
    -- 错误信息
    `error_code`        VARCHAR(50),
    `error_message`     TEXT,
    `retry_count`       INT DEFAULT 0,
    `max_retries`       INT DEFAULT 3,
    
    -- 时间戳
    `queued_at`         DATETIME,               -- 进入队列时间
    `started_at`        DATETIME,               -- 开始处理时间
    `completed_at`      DATETIME,               -- 完成时间
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        DATETIME,
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_type` (`type`),
    INDEX `idx_user_status` (`user_id`, `status`),
    INDEX `idx_created` (`created_at`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 订单表 (orders)

```sql
CREATE TABLE `orders` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`           BIGINT UNSIGNED NOT NULL,
    
    -- 订单信息
    `order_no`          VARCHAR(32) UNIQUE NOT NULL, -- 订单号
    `type`              VARCHAR(20) NOT NULL,       -- monthly, yearly, enterprise
    `membership_type`   VARCHAR(20) NOT NULL,       -- basic, premium
    
    -- 金额
    `amount`            DECIMAL(10, 2) NOT NULL,    -- 实际支付金额
    `original_amount`   DECIMAL(10, 2) NOT NULL,    -- 原价
    `discount_amount`   DECIMAL(10, 2) DEFAULT 0,   -- 优惠金额
    
    -- 状态
    `status`            VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled, refunded
    `paid_at`           DATETIME,
    
    -- 会员有效期
    `membership_days`   INT NOT NULL,               -- 会员天数
    `membership_starts_at` DATETIME,
    `membership_expires_at` DATETIME,
    
    -- 支付信息
    `payment_channel`   VARCHAR(20),                -- alipay, wechat
    `payment_no`        VARCHAR(64),                -- 第三方支付流水号
    
    -- 其他
    `coupon_code`       VARCHAR(50),
    `remark`            TEXT,
    
    -- 时间戳
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`        DATETIME,
    
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_order_no` (`order_no`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created` (`created_at`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.5 支付记录表 (payments)

```sql
CREATE TABLE `payments` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id`          BIGINT UNSIGNED NOT NULL,
    
    -- 支付信息
    `channel`           VARCHAR(20) NOT NULL,       -- alipay, wechat, stripe
    `amount`            DECIMAL(10, 2) NOT NULL,
    `currency`          VARCHAR(3) DEFAULT 'CNY',
    
    -- 第三方信息
    `third_party_no`    VARCHAR(64),                -- 第三方支付流水号
    `third_party_data`  JSON,                       -- 完整回调数据
    
    -- 状态
    `status`            VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, refunded
    `paid_at`           DATETIME,
    
    -- 错误信息
    `error_code`        VARCHAR(50),
    `error_message`     TEXT,
    
    -- 时间戳
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_order_id` (`order_id`),
    INDEX `idx_third_party` (`third_party_no`),
    INDEX `idx_status` (`status`),
    
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.6 用户统计表 (user_stats)

```sql
CREATE TABLE `user_stats` (
    `user_id`           BIGINT UNSIGNED PRIMARY KEY,
    
    -- 使用统计
    `total_tasks`       INT DEFAULT 0,
    `total_files`       INT DEFAULT 0,
    `total_input_size`  BIGINT UNSIGNED DEFAULT 0,  -- 上传总大小(字节)
    `total_output_size` BIGINT UNSIGNED DEFAULT 0,  -- 下载总大小(字节)
    
    -- 任务类型分布
    `task_type_stats`   JSON DEFAULT '{}',          -- {pdf_to_word: 10, pdf_merge: 5}
    
    -- 每日统计(最近30天)
    `daily_stats`       JSON DEFAULT '[]',
    
    -- 活跃时间
    `last_active_at`    DATETIME,
    `first_task_at`     DATETIME,
    
    -- 更新时间
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_active` (`last_active_at`),
    
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.7 系统配置表 (system_configs)

```sql
CREATE TABLE `system_configs` (
    `id`                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `config_key`        VARCHAR(100) UNIQUE NOT NULL,
    `config_value`      JSON NOT NULL,
    `description`       TEXT,
    `updated_by`        BIGINT UNSIGNED,
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_key` (`config_key`),
    
    FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('membership_limits', '{
    "free": {"daily_quota": 3, "max_file_size": 10, "max_batch_size": 3},
    "basic": {"daily_quota": 999999, "max_file_size": 50, "max_batch_size": 20},
    "premium": {"daily_quota": 999999, "max_file_size": 100, "max_batch_size": 50}
}', '会员等级限制配置'),

('pricing', '{
    "monthly": {"basic": 19.9, "premium": 49.9},
    "yearly": {"basic": 168, "premium": 399}
}', '定价配置'),

('file_storage', '{
    "expires_hours": 24,
    "max_storage_days": 7
}', '文件存储配置');
```

## 4. Redis 数据结构

### 4.1 缓存键设计

| 用途 | Key 格式 | 示例 | TTL |
|------|----------|------|-----|
| 用户会话 | `session:{token}` | `session:abc123` | 7天 |
| 用户信息 | `user:{id}` | `user:1001` | 1小时 |
| 用户配额 | `quota:{user_id}` | `quota:1001` | 1天 |
| 文件元数据 | `file:{id}` | `file:2001` | 1小时 |
| 任务状态 | `task:{id}` | `task:3001` | 24小时 |

### 4.2 任务队列 (Redis Stream)

```
# 任务队列
STREAM: tasks:queue

# 消费者组
GROUP: task-workers

# 任务消息格式
{
  "task_id": "3001",
  "type": "pdf_to_word",
  "priority": 5,
  "user_id": "1001",
  "created_at": "2026-03-22T10:00:00Z"
}
```

### 4.3 限流计数器

```
# 用户每日限额
KEY: rate_limit:daily:{user_id}:{date}
TYPE: String (计数器)
TTL: 24小时

# 接口限流 (滑动窗口)
KEY: rate_limit:api:{endpoint}:{user_id}
TYPE: Sorted Set (时间戳)
TTL: 1分钟
```

## 5. 数据库优化策略

### 5.1 分区策略

```sql
-- 任务表按月分区(数据量大时)
-- MySQL 8.0 支持原生分区
CREATE TABLE tasks_partitioned (
    -- 相同字段
) PARTITION BY RANGE (YEAR(created_at) * 100 + MONTH(created_at)) (
    PARTITION p202603 VALUES LESS THAN (202604),
    PARTITION p202604 VALUES LESS THAN (202605),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### 5.2 读写分离

- **写操作**: 主库 (INSERT, UPDATE, DELETE)
- **读操作**: 从库 (SELECT)
- **延迟容忍**: 允许秒级延迟

### 5.3 连接池配置

```yaml
# 应用层连接池配置 (MySQL)
database:
  pool:
    min: 5
    max: 20
    acquire_timeout: 5000ms
    idle_timeout: 300000ms
    max_lifetime: 1200000ms
```

## 6. 数据备份策略

| 数据类型 | 备份频率 | 保留周期 | 方式 |
|----------|----------|----------|------|
| 数据库全量 | 每日 | 30天 | mysqldump |
| 数据库增量 | 每小时 | 7天 | binlog |
| 文件存储 | 实时同步 | 跨区域 | MinIO复制 |
| 配置文件 | 版本控制 | 永久 | Git |

---

*文档版本: v1.1 (MySQL版)*
*更新日期: 2026-03-22*
*维护者: 架构师*
