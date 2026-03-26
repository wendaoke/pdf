# PDF 合并 MVP Redis Stream 设计

## 1. Stream 与消费组

- 主 Stream：`stream:pdf:merge:task`
- 死信 Stream：`stream:pdf:merge:task:dlq`
- 消费组：`merge_worker_group`
- 消费者命名：`worker-{ip}-{pid}`

## 2. 消息模型

字段定义（扁平化）：

- `taskId`
- `ownerId`
- `ownerType` (`ANON`/`USER`)
- `retryCount`
- `createdAt`
- `traceId`

示例：

```text
XADD stream:pdf:merge:task * taskId 7f... ownerId anon_abc ownerType ANON retryCount 0 createdAt 2026-03-24T01:00:00.000Z traceId tr_123
```

## 3. 消费处理流程

1. `XREADGROUP GROUP merge_worker_group worker-1 COUNT 10 BLOCK 2000 STREAMS stream:pdf:merge:task >`
2. 对每条消息执行任务处理逻辑
3. 成功：`XACK` + 可选 `XDEL`
4. 失败：
   - 可重试：保留 pending，并更新数据库重试计数
   - 超过阈值：投递到 DLQ，原消息 `XACK`

## 4. 重试与死信

- `maxRetry = 2`
- 退避策略：`1s -> 5s`
- 进入 DLQ 条件：
  - 重试次数超限
  - 文件缺失不可恢复
  - 引擎不可恢复错误（明确错误码白名单外）

DLQ 额外字段：

- `failedCode`
- `failedMessage`
- `failedAt`

## 5. Pending 恢复

Worker 启动时执行：

- `XPENDING stream:pdf:merge:task merge_worker_group`
- 对超时未确认消息（例如 60s）执行 `XAUTOCLAIM`
- 重新处理并按重试规则分流

## 6. 监控指标

- `stream_lag`（累计未消费）
- `pending_count`
- `consume_success_rate`
- `dlq_increase_rate`
- `avg_consume_latency_ms`

## 7. 运维命令（常用）

```bash
# 查看组
XINFO GROUPS stream:pdf:merge:task

# 查看消费者
XINFO CONSUMERS stream:pdf:merge:task merge_worker_group

# 查看 pending
XPENDING stream:pdf:merge:task merge_worker_group
```
