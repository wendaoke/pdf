# PDF 合并 MVP Java 模块拆分（可开工）

## 1. 模块结构

建议采用多模块 Maven 工程，最少 3 个模块：

- `pdf-merge-api`
  - 对外 REST API、鉴权、参数校验、任务编排、下载 token 签发
- `pdf-merge-worker`
  - Redis Stream 消费、PDF 合并执行、结果回写、重试与死信处理
- `pdf-merge-common`
  - DTO、错误码、枚举、数据库实体、工具类、统一配置

目录建议：

```text
pdf-merge/
  pom.xml
  pdf-merge-common/
  pdf-merge-api/
  pdf-merge-worker/
```

## 2. 包结构建议

统一根包：`com.company.pdfmerge`

- `api`：controller、request/response、facade
- `application`：usecase/service（业务编排）
- `domain`：entity、repository、domain-service
- `infrastructure`
  - `persistence`（MySQL）
  - `stream`（Redis Stream）
  - `storage`（LocalFileStorage）
  - `pdf`（PDFBox 适配）

## 3. API 模块职责

- 上传初始化：生成 `uploadToken` 与目标文件名
- 上传确认：强校验文件类型/大小/可读性
- 创建任务：校验顺序、配额、幂等后写入 MySQL 并投递 Stream
- 状态查询：返回任务状态与进度
- 下载：签发 `downloadToken` 并基于 token 流式返回 PDF

## 4. Worker 模块职责

- 消费组：`merge_worker_group`
- 消费者：`worker-{hostname}-{pid}`
- 处理逻辑：
  1. 拉取任务消息
  2. CAS 更新任务状态 `QUEUED -> PROCESSING`
  3. 顺序读取输入文件并合并
  4. 写入输出文件、更新状态为 `SUCCEEDED`
  5. 失败时记录错误码并按重试策略处理

## 5. 版本与基线

- JDK：`21`
- Spring Boot：`4.0.4`
- MySQL：`8.0+`
- Redis：`7.2+`
- PDF 引擎：`Apache PDFBox 3.x`

## 6. 第一批开发任务（建议）

- `T1`：搭建父子模块与公共 starter
- `T2`：落地 MySQL 表结构与 DAO
- `T3`：实现上传初始化/确认 + 本地存储
- `T4`：实现任务创建/查询 + Redis Stream 投递
- `T5`：实现 Worker 消费、合并、回写
- `T6`：实现 downloadToken 签发与下载接口
- `T7`：补齐集成测试与压测脚本
