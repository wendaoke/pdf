# PDF 合并 MVP Spring Boot 4.0.4 启动骨架

## 1. 工程结构

```text
pdf-merge/
  pom.xml
  pdf-merge-common/
    pom.xml
    src/main/java/com/company/pdfmerge/common/...
  pdf-merge-api/
    pom.xml
    src/main/java/com/company/pdfmerge/接口/...
  pdf-merge-worker/
    pom.xml
    src/main/java/com/company/pdfmerge/worker/...
```

## 2. 父工程 pom.xml（示例）

```xml
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.company</groupId>
  <artifactId>pdf-merge</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>pom</packaging>

  <modules>
    <module>pdf-merge-common</module>
    <module>pdf-merge-api</module>
    <module>pdf-merge-worker</module>
  </modules>

  <properties>
    <java.version>21</java.version>
    <spring-boot.version>4.0.4</spring-boot.version>
    <mapstruct.version>1.6.0</mapstruct.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring-boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>
```

## 3. 子模块依赖建议

### 3.1 pdf-merge-common

- `spring-boot-starter-validation`
- `spring-boot-starter-data-jpa`
- `mysql-connector-j`
- `lombok`（可选）

### 3.2 pdf-merge-api

- `spring-boot-starter-web`
- `spring-boot-starter-security`（若启用登录态）
- `spring-boot-starter-data-redis`
- `spring-boot-starter-actuator`
- 依赖 `pdf-merge-common`

### 3.3 pdf-merge-worker

- `spring-boot-starter`
- `spring-boot-starter-data-redis`
- `spring-boot-starter-actuator`
- `org.apache.pdfbox:pdfbox`
- 依赖 `pdf-merge-common`

## 4. 包与类骨架

### 4.1 common 模块

- `com.company.pdfmerge.common.enums.TaskStatus`
- `com.company.pdfmerge.common.enums.FileStatus`
- `com.company.pdfmerge.common.error.MergeErrorCode`
- `com.company.pdfmerge.common.entity.MergeTaskEntity`
- `com.company.pdfmerge.common.entity.MergeTaskFileEntity`
- `com.company.pdfmerge.common.repository.MergeTaskRepository`
- `com.company.pdfmerge.common.repository.MergeTaskFileRepository`
- `com.company.pdfmerge.common.config.PdfMergeProperties`

### 4.2 api 模块

- `PdfMergeApiApplication`
- `controller.MergeUploadController`
- `controller.MergeTaskController`
- `service.UploadService`
- `service.MergeTaskService`
- `service.DownloadTokenService`
- `storage.LocalFileStorageService`
- `stream.MergeTaskProducer`

关键方法签名（建议）：

```java
public interface UploadService {
    InitUploadResponse initUploads(InitUploadRequest request, OwnerContext owner);
    UploadCompleteResponse completeUpload(UploadCompleteRequest request, OwnerContext owner);
}

public interface MergeTaskService {
    CreateTaskResponse createTask(CreateTaskRequest request, OwnerContext owner, String idempotencyKey);
    TaskDetailResponse getTask(String taskId, OwnerContext owner);
}

public interface DownloadTokenService {
    DownloadTokenResponse createToken(String taskId, OwnerContext owner);
    FileDownloadView verifyAndResolve(String taskId, String token, OwnerContext owner);
}
```

### 4.3 worker 模块

- `PdfMergeWorkerApplication`
- `consumer.RedisStreamTaskConsumer`
- `handler.MergeTaskHandler`
- `service.PdfMergeEngineService`
- `service.TaskStateTransitionService`
- `service.DlqService`

关键方法签名（建议）：

```java
public interface MergeTaskHandler {
    void handle(String messageId, MergeTaskMessage message);
}

public interface PdfMergeEngineService {
    MergeResult merge(List<String> inputPaths, String outputPath);
}
```

## 5. 最小配置类

- `PdfMergeProperties`
  - `limits.nFiles`
  - `limits.sSingleBytes`
  - `limits.sTotalBytes`
  - `storage.rootDir`
  - `queue.streamKey`
  - `queue.dlqStreamKey`
  - `queue.consumerGroup`
  - `download.tokenExpireMinutes`

## 6. 最小启动顺序（Day-1）

1. 建库建表：执行 `PDF合并-MySQL-DDL.sql`
2. 启动 Redis 与创建消费组（首次）
3. 启动 `pdf-merge-api`
4. 启动 `pdf-merge-worker --spring.profiles.active=worker`
5. 用 API 文档联调上传、建任务、查询、下载

## 7. 本地联调检查清单

- API 健康检查：`/actuator/health`
- Worker 能消费 Stream 消息
- 任务状态能从 `QUEUED` 变更到 `SUCCEEDED/FAILED`
- 输出文件落盘到 `storage.rootDir`
- 下载 token 超时后不可用

## 8. 下一步建议

- 增加 Testcontainers 集成测试（MySQL + Redis）
- 增加异常注入测试（损坏文件、磁盘满、超时）
- 增加压测脚本（并发上传 + 队列积压）
