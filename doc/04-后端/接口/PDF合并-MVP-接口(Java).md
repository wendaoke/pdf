# PDF 合并 MVP API 契约（Java 实施）

## 1. 通用约定

- Base URL：`/接口/v1/pdf/merge`
- Content-Type：`application/json`
- 成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## 2. 上传初始化

`POST /uploads:init`

请求：

```json
{
  "files": [
    { "name": "a.pdf", "size": 12345 },
    { "name": "b.pdf", "size": 45678 }
  ]
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "uploadItems": [
      {
        "fileId": "f_001",
        "localFileName": "uuid-1.pdf",
        "uploadToken": "up_xxx"
      }
    ],
    "limits": {
      "N_files": 20,
      "S_single": 52428800,
      "S_total": 209715200
    }
  }
}
```

## 3. 上传确认

`POST /uploads:complete`

请求：

```json
{
  "fileId": "f_001",
  "uploadToken": "up_xxx"
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "status": "READY"
  }
}
```

## 4. 创建任务

`POST /tasks`

请求头：

- `Idempotency-Key: <uuid>`

请求：

```json
{
  "files": [
    { "fileId": "f_001", "orderIndex": 1 },
    { "fileId": "f_002", "orderIndex": 2 }
  ]
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "taskId": "t_001",
    "status": "QUEUED"
  }
}
```

## 5. 查询任务

`GET /tasks/{taskId}`

响应：

```json
{
  "code": 0,
  "data": {
    "taskId": "t_001",
    "status": "PROCESSING",
    "progress": {
      "stage": "MERGING",
      "current": 1,
      "total": 2
    },
    "errorCode": null,
    "result": null
  }
}
```

## 6. 获取下载 token

`POST /tasks/{taskId}/download-token`

响应：

```json
{
  "code": 0,
  "data": {
    "downloadToken": "dl_xxx",
    "expireAt": "2026-03-24T02:00:00.000Z"
  }
}
```

## 7. 下载结果文件

`GET /tasks/{taskId}/download?token=dl_xxx`

响应：

- `200 application/pdf`
- Header:
  - `Content-Disposition: attachment; filename=merged.pdf`
  - `Cache-Control: no-store`

## 8. 错误码（MVP）

| 错误码 | 说明 |
|------|------|
| `MERGE_400_PDF_INVALID` | 文件不是有效 PDF |
| `MERGE_400_FILE_TOO_LARGE` | 单文件超过上限 |
| `MERGE_400_TOO_MANY_FILES` | 文件数超过上限 |
| `MERGE_400_TOTAL_TOO_LARGE` | 总大小超过上限 |
| `MERGE_400_ENCRYPTED_UNSUPPORTED` | 不支持加密 PDF |
| `MERGE_422_PDF_CORRUPTED` | 文件损坏或不可读 |
| `MERGE_503_ENGINE_FAILED` | 合并引擎失败 |
| `MERGE_504_TIMEOUT` | 处理超时 |
| `MERGE_599_NETWORK` | 网络中断 |
