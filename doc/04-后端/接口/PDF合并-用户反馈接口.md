# 用户反馈接口（MVP）

## 提交反馈

- **方法 / 路径**：`POST /api/v1/feedback`
- **Content-Type**：`application/json`
- **请求头（可选）**：`X-Owner-Id` — 与 PDF 合并接口一致的匿名维度（如 `anon_local`），便于与合并任务关联分析；不传则 `owner_id` 存空。

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | string | 是 | 问题描述；长度上限由配置 `pdfmerge.feedback.max-content-chars` 控制（默认 2000 字符，按 Unicode 码点计） |
| `contact` | string | 否 | 联系方式，最多 128 字符（邮箱/手机/昵称等） |
| `category` | string | 否 | `merge` \| `upload` \| `other` |
| `context` | object | 否 | 仅白名单键会被写入 `context_json`：`pagePath`、`userAgent`、`taskId`、`clientVersion`；服务端会追加 `receivedAt`（ISO-8601）。各字符串字段在服务端会截断（如 `pagePath`/`userAgent` 最多 512 字符） |

**隐私说明**：请勿在 `context` 中传入上传令牌、完整磁盘路径、Cookie 等敏感信息；后端只保留上述白名单字段。

### 成功响应

与统一封装一致：`{ "code": 0, "message": "success", "data": { "feedbackId": <long> } }`

### 错误响应

与现有全局异常一致：`HTTP 400` 时 `data.error` 为人类可读文案（如「请填写问题描述」「问题类型无效」）。

### 运营查看（MVP）

```sql
SELECT id, owner_id, contact, category, status, created_at,
       LEFT(content, 200) AS content_preview,
       context_json
FROM user_feedback
ORDER BY created_at DESC
LIMIT 100;
```

### 配置

`application.yml`：

```yaml
pdfmerge:
  feedback:
    max-content-chars: 2000
```

### 二期（未实现）

管理端列表、状态流转（`REVIEWING` / `REPLIED` / `CLOSED`）、邮件/Webhook 通知等。
