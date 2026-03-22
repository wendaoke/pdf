# PDF工具集 - API 接口规范

## 1. API 设计原则

### 1.1 RESTful 规范

- **URL**: 小写字母，连字符分隔
- **HTTP方法**: GET(查询)、POST(创建)、PUT(更新)、DELETE(删除)
- **状态码**: 标准HTTP状态码
- **内容类型**: `application/json`

### 1.2 版本控制

```
/api/v1/users
/api/v2/users
```

### 1.3 响应格式

```typescript
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 1001,
  "message": "参数错误",
  "data": null,
  "details": { ... }  // 可选详细错误信息
}
```

## 2. 认证授权

### 2.1 JWT Token

```http
Authorization: Bearer <access_token>
```

### 2.2 Token 刷新

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

## 3. 接口清单

### 3.1 认证模块 (Auth)

#### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称"
}

Response 200:
{
  "code": 0,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "用户昵称",
      "membership_type": "free"
    },
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "expires_in": 3600
    }
  }
}
```

#### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 微信登录
```http
POST /api/v1/auth/wechat
Content-Type: application/json

{
  "code": "wechat_auth_code"
}
```

### 3.2 用户模块 (User)

#### 获取当前用户信息
```http
GET /api/v1/users/me
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "phone": null,
    "nickname": "用户昵称",
    "avatar": "https://...",
    "membership": {
      "type": "free",
      "expires_at": null
    },
    "quota": {
      "daily_limit": 3,
      "daily_used": 1,
      "max_file_size": 10,
      "max_batch_size": 3
    },
    "stats": {
      "total_tasks": 10,
      "total_files": 25
    }
  }
}
```

#### 更新用户信息
```http
PUT /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "avatar": "https://..."
}
```

#### 获取用户任务历史
```http
GET /api/v1/users/me/tasks?page=1&limit=20&type=pdf_to_word
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1001,
        "type": "pdf_to_word",
        "status": "completed",
        "input_files": [{"name": "input.pdf", "size": 2048576}],
        "output_files": [{"name": "output.docx", "size": 1536000}],
        "created_at": "2026-03-22T10:00:00Z",
        "completed_at": "2026-03-22T10:00:15Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 3.3 文件模块 (File)

#### 获取上传凭证
```http
POST /api/v1/files/upload-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "document.pdf",
  "size": 5242880,
  "mime_type": "application/pdf"
}

Response 200:
{
  "code": 0,
  "data": {
    "file_id": 1001,
    "upload_url": "https://minio.example.com/...",
    "upload_method": "PUT",
    "upload_headers": {
      "Content-Type": "application/pdf"
    },
    "expires_in": 300
  }
}
```

#### 确认文件上传完成
```http
POST /api/v1/files/1001/confirm
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "id": 1001,
    "filename": "document.pdf",
    "size": 5242880,
    "page_count": 10,
    "status": "active"
  }
}
```

#### 获取文件下载链接
```http
GET /api/v1/files/1001/download
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "download_url": "https://minio.example.com/...",
    "expires_in": 300,
    "filename": "document.pdf"
  }
}
```

### 3.4 任务模块 (Task)

#### 创建转换任务
```http
POST /api/v1/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "pdf_to_word",
  "input_files": [1001, 1002],
  "config": {
    "output_format": "docx",
    "conversion_mode": "precise",
    "page_range": "all"
  }
}

Response 200:
{
  "code": 0,
  "data": {
    "id": 2001,
    "type": "pdf_to_word",
    "status": "pending",
    "input_files": [
      {"id": 1001, "name": "doc1.pdf", "size": 2048576}
    ],
    "config": {
      "output_format": "docx",
      "conversion_mode": "precise"
    },
    "progress": 0,
    "created_at": "2026-03-22T10:00:00Z"
  }
}
```

#### 获取任务详情
```http
GET /api/v1/tasks/2001
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "id": 2001,
    "type": "pdf_to_word",
    "status": "completed",
    "input_files": [
      {"id": 1001, "name": "input.pdf", "size": 2048576}
    ],
    "output_files": [
      {
        "id": 1002,
        "name": "output.docx",
        "size": 1536000,
        "download_url": "/api/v1/files/1002/download"
      }
    ],
    "progress": 100,
    "result_info": {
      "input_pages": 10,
      "output_pages": 10,
      "processing_time": 15
    },
    "created_at": "2026-03-22T10:00:00Z",
    "started_at": "2026-03-22T10:00:01Z",
    "completed_at": "2026-03-22T10:00:16Z"
  }
}
```

#### 获取任务进度 (WebSocket)
```javascript
// WebSocket 连接
const ws = new WebSocket('wss://api.example.com/ws/tasks/2001');

// 接收进度更新
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
  // {
  //   "task_id": 2001,
  //   "status": "processing",
  //   "progress": 45,
  //   "message": "正在转换第5页..."
  // }
};
```

#### 取消任务
```http
POST /api/v1/tasks/2001/cancel
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "message": "任务已取消"
}
```

#### 获取支持的转换类型
```http
GET /api/v1/tasks/types

Response 200:
{
  "code": 0,
  "data": {
    "conversions": [
      {
        "type": "pdf_to_word",
        "name": "PDF转Word",
        "icon": "pdf-to-word.svg",
        "supported_formats": [".pdf"],
        "output_formats": [".docx", ".doc"],
        "description": "将PDF转换为可编辑的Word文档"
      },
      {
        "type": "pdf_merge",
        "name": "PDF合并",
        "icon": "pdf-merge.svg",
        "supported_formats": [".pdf"],
        "output_formats": [".pdf"],
        "description": "将多个PDF合并为一个"
      }
    ]
  }
}
```

### 3.5 订单模块 (Order)

#### 获取会员套餐
```http
GET /api/v1/orders/plans

Response 200:
{
  "code": 0,
  "data": {
    "plans": [
      {
        "type": "monthly",
        "membership_type": "basic",
        "name": "基础版月卡",
        "price": 19.9,
        "original_price": 29.9,
        "features": [
          "无限次转换",
          "单文件最大50MB",
          "批量处理20个文件"
        ]
      },
      {
        "type": "yearly",
        "membership_type": "premium",
        "name": "高级版年卡",
        "price": 399,
        "original_price": 599,
        "features": [
          "无限次转换",
          "单文件最大100MB",
          "批量处理50个文件",
          "优先处理队列"
        ]
      }
    ]
  }
}
```

#### 创建订单
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan_type": "monthly",
  "membership_type": "basic",
  "coupon_code": "SAVE10"
}

Response 200:
{
  "code": 0,
  "data": {
    "id": 3001,
    "order_no": "ORD202603220001",
    "amount": 17.91,
    "original_amount": 19.9,
    "discount_amount": 1.99,
    "status": "pending",
    "created_at": "2026-03-22T10:00:00Z"
  }
}
```

#### 获取支付参数
```http
POST /api/v1/orders/3001/pay
Authorization: Bearer <token>
Content-Type: application/json

{
  "channel": "alipay"
}

Response 200:
{
  "code": 0,
  "data": {
    "order_id": 3001,
    "channel": "alipay",
    "payment_params": {
      // 支付宝SDK参数
    }
  }
}
```

#### 查询订单状态
```http
GET /api/v1/orders/3001
Authorization: Bearer <token>

Response 200:
{
  "code": 0,
  "data": {
    "id": 3001,
    "order_no": "ORD202603220001",
    "status": "paid",
    "amount": 17.91,
    "paid_at": "2026-03-22T10:05:00Z",
    "membership_expires_at": "2026-04-22T10:05:00Z"
  }
}
```

### 3.6 系统模块 (System)

#### 获取系统配置
```http
GET /api/v1/system/config

Response 200:
{
  "code": 0,
  "data": {
    "file_limits": {
      "max_size": 100,
      "allowed_types": ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "png"]
    },
    "membership": {
      "free": {
        "daily_quota": 3,
        "max_file_size": 10
      }
    }
  }
}
```

## 4. 错误码定义

### 4.1 通用错误码 (1xxx)

| 错误码 | 说明 | HTTP状态码 |
|--------|------|-----------|
| 0 | 成功 | 200 |
| 1000 | 未知错误 | 500 |
| 1001 | 参数错误 | 400 |
| 1002 | 未授权 | 401 |
| 1003 | 禁止访问 | 403 |
| 1004 | 资源不存在 | 404 |
| 1005 | 请求过于频繁 | 429 |
| 1006 | 服务器内部错误 | 500 |

### 4.2 认证错误码 (2xxx)

| 错误码 | 说明 |
|--------|------|
| 2001 | 邮箱已存在 |
| 2002 | 手机号已存在 |
| 2003 | 邮箱或密码错误 |
| 2004 | 账号已被禁用 |
| 2005 | Token已过期 |
| 2006 | Token无效 |

### 4.3 文件错误码 (3xxx)

| 错误码 | 说明 |
|--------|------|
| 3001 | 文件大小超出限制 |
| 3002 | 文件类型不支持 |
| 3003 | 文件上传失败 |
| 3004 | 文件不存在或已过期 |
| 3005 | 文件损坏 |
| 3006 | 文件被加密 |

### 4.4 任务错误码 (4xxx)

| 错误码 | 说明 |
|--------|------|
| 4001 | 每日限额已用完 |
| 4002 | 任务类型不支持 |
| 4003 | 任务创建失败 |
| 4004 | 任务处理失败 |
| 4005 | 任务已取消 |
| 4006 | 任务已过期 |

### 4.5 支付错误码 (5xxx)

| 错误码 | 说明 |
|--------|------|
| 5001 | 订单不存在 |
| 5002 | 订单已支付 |
| 5003 | 支付失败 |
| 5004 | 优惠券无效 |
| 5005 | 余额不足 |

## 5. 分页规范

```http
GET /api/v1/users/me/tasks?page=1&limit=20
```

**响应格式**:
```json
{
  "code": 0,
  "data": {
    "list": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

## 6. 限流策略

| 接口类型 | 限流策略 |
|----------|----------|
| 公开接口 | 100次/分钟/IP |
| 认证接口 | 1000次/分钟/用户 |
| 文件上传 | 10次/分钟/用户 |
| 任务创建 | 免费3次/天，会员不限 |

---

*文档版本: v1.0*
*创建日期: 2026-03-22*
*维护者: 架构师*
