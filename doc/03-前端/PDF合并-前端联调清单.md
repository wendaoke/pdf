# PDF 合并 MVP 前端联调清单

## 1. 联调前准备

- [ ] 已获取后端联调环境地址与鉴权方式
- [ ] 已确认接口基路径：`/接口/v1/pdf/merge`
- [ ] 已确认限额参数：`N_files`、`S_single`、`S_total`
- [ ] 已接入统一错误处理（支持 `errorCode`）
- [ ] 已开启埋点日志（至少 console 或 mock 上报）

## 2. 接口联调检查

### 2.1 上传初始化 `POST /uploads:init`

- [ ] 传入 2 个正常 PDF 文件，返回 `uploadItems`
- [ ] 返回字段包含：`fileId`、`localFileName`、`uploadToken`
- [ ] 返回字段包含 `limits` 且值非空

### 2.2 上传确认 `POST /uploads:complete`

- [ ] 正常文件返回 `status=READY`
- [ ] 非 PDF/损坏文件返回 `status=FAILED` + `errorCode`
- [ ] 前端正确映射错误提示

### 2.3 创建任务 `POST /tasks`

- [ ] 至少 2 个 `READY` 文件时创建成功
- [ ] 响应包含 `taskId`、`status=QUEUED`
- [ ] 重复点击时 `Idempotency-Key` 生效，无重复任务

### 2.4 查询任务 `GET /tasks/{taskId}`

- [ ] 可从 `QUEUED -> PROCESSING -> SUCCEEDED/FAILED`
- [ ] `progress` 字段存在时前端可渲染进度
- [ ] 失败时 `errorCode` 可展示明确文案

### 2.5 下载 `POST /download-token` + `GET /download`

- [ ] 成功任务可获取 `downloadToken`
- [ ] 使用 `downloadToken` 可下载 `application/pdf`
- [ ] 过期 token 下载失败时前端提示正确

## 3. 页面交互联调

- [ ] 文件拖拽上传可用
- [ ] 文件列表排序后提交顺序正确
- [ ] “开始合并”按钮启用条件正确（>=2 READY 且无 UPLOADING）
- [ ] 合并中按钮禁用，防止重复提交
- [ ] 失败后支持保留列表并重试

## 4. 错误码映射验证

- [ ] `MERGE_400_PDF_INVALID`
- [ ] `MERGE_400_FILE_TOO_LARGE`
- [ ] `MERGE_400_TOO_MANY_FILES`
- [ ] `MERGE_400_TOTAL_TOO_LARGE`
- [ ] `MERGE_400_ENCRYPTED_UNSUPPORTED`
- [ ] `MERGE_422_PDF_CORRUPTED`
- [ ] `MERGE_503_ENGINE_FAILED`
- [ ] `MERGE_504_TIMEOUT`
- [ ] `MERGE_599_NETWORK`

## 5. 埋点联调

- [ ] `merge_enter`
- [ ] `merge_file_add`（含失败原因）
- [ ] `merge_order_change`
- [ ] `merge_submit`
- [ ] `merge_success`
- [ ] `merge_fail`（含 `error_code`）
- [ ] `merge_download`

## 6. 联调结论模板

- 联调日期：
- 前端分支：
- 后端版本：
- 通过项：
- 阻塞项：
- 需后端修复：
- 需前端修复：
