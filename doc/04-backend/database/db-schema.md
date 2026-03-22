# PDF工具集 - 数据库设计

## 1. 数据库选型

- **主数据库**: PostgreSQL 15
- **缓存**: Redis 7
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
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(20) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    nickname        VARCHAR(50),
    avatar          VARCHAR(500),
    
    -- 会员信息
    membership_type VARCHAR(20) DEFAULT 'free', -- free, basic, premium
    membership_expires_at TIMESTAMP,
    
    -- 使用配额
    daily_quota     INTEGER DEFAULT 3,          -- 每日转换次数
    max_file_size   INTEGER DEFAULT 10,         -- MB
    max_batch_size  INTEGER DEFAULT 3,          -- 批量处理数量
    
    -- 统计
    total_tasks     INTEGER DEFAULT 0,
    total_files     INTEGER DEFAULT 0,
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login_at   TIMESTAMP,
    last_login_ip   INET,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP                   -- 软删除
);

-- 索引
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone ON users(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_membership ON users(membership_type) WHERE deleted_at IS NULL;
```

### 3.2 文件表 (files)

```sql
CREATE TABLE files (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    task_id         BIGINT,                     -- 关联任务ID
    
    -- 文件信息
    filename        VARCHAR(255) NOT NULL,      -- 存储文件名(UUID)
    original_name   VARCHAR(255) NOT NULL,      -- 原始文件名
    size            BIGINT NOT NULL,            -- 字节
    mime_type       VARCHAR(100) NOT NULL,
    extension       VARCHAR(20),
    
    -- 存储路径
    storage_bucket  VARCHAR(50) DEFAULT 'pdf-files',
    storage_path    VARCHAR(500) NOT NULL,      -- 对象存储路径
    storage_endpoint VARCHAR(200),              -- 存储端点
    
    -- 文件元数据
    page_count      INTEGER,                    -- PDF页数
    is_encrypted    BOOLEAN DEFAULT FALSE,      -- 是否加密
    metadata        JSONB,                      -- 其他元数据
    
    -- 状态
    status          VARCHAR(20) DEFAULT 'active', -- active, processing, deleted
    expires_at      TIMESTAMP,                  -- 自动删除时间
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 索引
CREATE INDEX idx_files_user_id ON files(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_task_id ON files(task_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_expires ON files(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_files_status ON files(status);
```

### 3.3 任务表 (tasks)

```sql
CREATE TYPE task_type AS ENUM (
    'pdf_to_word', 'pdf_to_excel', 'pdf_to_ppt', 'pdf_to_image', 'pdf_to_txt',
    'word_to_pdf', 'excel_to_pdf', 'ppt_to_pdf', 'image_to_pdf',
    'pdf_merge', 'pdf_split', 'pdf_compress', 'pdf_edit', 'pdf_ocr'
);

CREATE TYPE task_status AS ENUM (
    'pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'
);

CREATE TABLE tasks (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    -- 任务信息
    type            task_type NOT NULL,
    status          task_status DEFAULT 'pending',
    priority        INTEGER DEFAULT 5,          -- 1-10, 数字越小优先级越高
    
    -- 输入文件
    input_files     JSONB NOT NULL,             -- [{file_id, filename, size, page_count}]
    
    -- 任务配置
    config          JSONB NOT NULL,             -- 转换配置参数
    
    -- 输出结果
    output_files    JSONB,                      -- [{file_id, filename, size, download_url}]
    result_info     JSONB,                      -- 转换结果信息(页数、压缩率等)
    
    -- 进度
    progress        INTEGER DEFAULT 0,          -- 0-100
    progress_message VARCHAR(200),              -- 当前步骤描述
    
    -- 错误信息
    error_code      VARCHAR(50),
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 3,
    
    -- 时间戳
    queued_at       TIMESTAMP,                  -- 进入队列时间
    started_at      TIMESTAMP,                  -- 开始处理时间
    completed_at    TIMESTAMP,                  -- 完成时间
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 软删除
    deleted_at      TIMESTAMP
);

-- 索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_type ON tasks(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created ON tasks(created_at DESC) WHERE deleted_at IS NULL;
```

### 3.4 订单表 (orders)

```sql
CREATE TYPE order_type AS ENUM ('monthly', 'yearly', 'enterprise');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled', 'refunded');

CREATE TABLE orders (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    
    -- 订单信息
    order_no        VARCHAR(32) UNIQUE NOT NULL, -- 订单号
    type            order_type NOT NULL,
    membership_type VARCHAR(20) NOT NULL,         -- basic, premium
    
    -- 金额
    amount          DECIMAL(10, 2) NOT NULL,      -- 实际支付金额
    original_amount DECIMAL(10, 2) NOT NULL,      -- 原价
    discount_amount DECIMAL(10, 2) DEFAULT 0,     -- 优惠金额
    
    -- 状态
    status          order_status DEFAULT 'pending',
    paid_at         TIMESTAMP,
    
    -- 会员有效期
    membership_days INTEGER NOT NULL,             -- 会员天数
    membership_starts_at TIMESTAMP,
    membership_expires_at TIMESTAMP,
    
    -- 支付信息
    payment_channel VARCHAR(20),                  -- alipay, wechat
    payment_no      VARCHAR(64),                  -- 第三方支付流水号
    
    -- 其他
    coupon_code     VARCHAR(50),
    remark          TEXT,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- 索引
CREATE INDEX idx_orders_user_id ON orders(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_order_no ON orders(order_no) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_created ON orders(created_at DESC) WHERE deleted_at IS NULL;
```

### 3.5 支付记录表 (payments)

```sql
CREATE TYPE payment_channel AS ENUM ('alipay', 'wechat', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded');

CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id),
    
    -- 支付信息
    channel         payment_channel NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'CNY',
    
    -- 第三方信息
    third_party_no  VARCHAR(64),                  -- 第三方支付流水号
    third_party_data JSONB,                       -- 完整回调数据
    
    -- 状态
    status          payment_status DEFAULT 'pending',
    paid_at         TIMESTAMP,
    
    -- 错误信息
    error_code      VARCHAR(50),
    error_message   TEXT,
    
    -- 时间戳
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_third_party ON payments(third_party_no);
CREATE INDEX idx_payments_status ON payments(status);
```

### 3.6 用户统计表 (user_stats)

```sql
CREATE TABLE user_stats (
    user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- 使用统计
    total_tasks     INTEGER DEFAULT 0,
    total_files     INTEGER DEFAULT 0,
    total_input_size BIGINT DEFAULT 0,            -- 上传总大小(字节)
    total_output_size BIGINT DEFAULT 0,           -- 下载总大小(字节)
    
    -- 任务类型分布
    task_type_stats JSONB DEFAULT '{}',           -- {pdf_to_word: 10, pdf_merge: 5}
    
    -- 每日统计(最近30天)
    daily_stats     JSONB DEFAULT '[]',
    
    -- 活跃时间
    last_active_at  TIMESTAMP,
    first_task_at   TIMESTAMP,
    
    -- 更新时间
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_stats_active ON user_stats(last_active_at);
```

### 3.7 系统配置表 (system_configs)

```sql
CREATE TABLE system_configs (
    id              BIGSERIAL PRIMARY KEY,
    key             VARCHAR(100) UNIQUE NOT NULL,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      BIGINT REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始配置
INSERT INTO system_configs (key, value, description) VALUES
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

## 4. JSONB 字段设计

### 4.1 tasks.config 示例

```json
{
  "pdf_to_word": {
    "output_format": "docx",
    "conversion_mode": "precise",
    "image_handling": "keep_original",
    "page_range": "all"
  },
  "pdf_merge": {
    "add_bookmarks": true,
    "bookmark_hierarchy": "by_file",
    "continuous_page_numbers": true
  },
  "pdf_compress": {
    "compression_level": "medium",
    "image_dpi": 150,
    "image_quality": 80
  }
}
```

### 4.2 tasks.input_files 示例

```json
[
  {
    "file_id": 1001,
    "filename": "contract.pdf",
    "size": 2048576,
    "page_count": 10,
    "page_range": "all"
  },
  {
    "file_id": 1002,
    "filename": "appendix.pdf",
    "size": 1024000,
    "page_count": 5,
    "page_range": "1-3"
  }
]
```

### 4.3 tasks.output_files 示例

```json
[
  {
    "file_id": 2001,
    "filename": "contract.docx",
    "size": 1536000,
    "download_url": "/api/files/2001/download?token=xxx",
    "expires_at": "2026-03-23T10:00:00Z"
  }
]
```

## 5. 数据库优化策略

### 5.1 分区策略

```sql
-- 任务表按月分区(数据量大时)
CREATE TABLE tasks_partitioned (
    LIKE tasks INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- 创建分区
CREATE TABLE tasks_y2026m03 PARTITION OF tasks_partitioned
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
```

### 5.2 读写分离

- **写操作**: 主库 (INSERT, UPDATE, DELETE)
- **读操作**: 从库 (SELECT)
- **延迟容忍**: 允许秒级延迟

### 5.3 连接池配置

```yaml
# 应用层连接池配置
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
| 数据库全量 | 每日 | 30天 | pg_dump |
| 数据库增量 | 每小时 | 7天 | WAL归档 |
| 文件存储 | 实时同步 | 跨区域 | MinIO复制 |
| 配置文件 | 版本控制 | 永久 | Git |

---

*文档版本: v1.0*
*创建日期: 2026-03-22*
*维护者: 架构师*
