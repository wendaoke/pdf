# PDF 合并 MVP Java 类骨架（最小可运行）

## 1. API 启动类

```java
package com.company.pdfmerge.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.company.pdfmerge")
public class PdfMergeApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(PdfMergeApiApplication.class, args);
    }
}
```

## 2. Worker 启动类

```java
package com.company.pdfmerge.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.company.pdfmerge")
public class PdfMergeWorkerApplication {
    public static void main(String[] args) {
        SpringApplication.run(PdfMergeWorkerApplication.class, args);
    }
}
```

## 3. API 控制器

```java
package com.company.pdfmerge.api.controller;

import com.company.pdfmerge.api.service.MergeTaskService;
import com.company.pdfmerge.api.service.UploadService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/接口/v1/pdf/merge")
public class MergeTaskController {

    private final UploadService uploadService;
    private final MergeTaskService mergeTaskService;

    public MergeTaskController(UploadService uploadService, MergeTaskService mergeTaskService) {
        this.uploadService = uploadService;
        this.mergeTaskService = mergeTaskService;
    }

    @PostMapping("/uploads:init")
    public Object initUploads(@RequestBody Object request) {
        return uploadService.initUploads(request);
    }

    @PostMapping("/uploads:complete")
    public Object completeUpload(@RequestBody Object request) {
        return uploadService.completeUpload(request);
    }

    @PostMapping("/tasks")
    public Object createTask(@RequestBody Object request,
                             @RequestHeader(value = "Idempotency-Key", required = false) String key) {
        return mergeTaskService.createTask(request, key);
    }

    @GetMapping("/tasks/{taskId}")
    public Object getTask(@PathVariable String taskId) {
        return mergeTaskService.getTask(taskId);
    }

    @PostMapping("/tasks/{taskId}/download-token")
    public Object createDownloadToken(@PathVariable String taskId) {
        return mergeTaskService.createDownloadToken(taskId);
    }
}
```

## 4. Stream 生产者

```java
package com.company.pdfmerge.api.stream;

import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class MergeTaskProducer {
    private final StringRedisTemplate redisTemplate;

    public MergeTaskProducer(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String send(String streamKey, String taskId, String ownerId, String traceId) {
        Map<String, String> value = new HashMap<>();
        value.put("taskId", taskId);
        value.put("ownerId", ownerId);
        value.put("traceId", traceId);
        value.put("retryCount", "0");
        RecordId id = redisTemplate.opsForStream()
                .add(MapRecord.create(streamKey, value));
        return id == null ? null : id.getValue();
    }
}
```

## 5. Stream 消费者（轮询）

```java
package com.company.pdfmerge.worker.consumer;

import jakarta.annotation.PostConstruct;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;

@Component
public class RedisStreamTaskConsumer {
    private final StringRedisTemplate redisTemplate;

    private final String streamKey = "stream:pdf:merge:task";
    private final String group = "merge_worker_group";
    private final String consumer = "worker-local";

    public RedisStreamTaskConsumer(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @PostConstruct
    public void initGroup() {
        try {
            redisTemplate.opsForStream().createGroup(streamKey, ReadOffset.latest(), group);
        } catch (Exception ignored) {
            // 组已存在时忽略
        }
    }

    @Scheduled(fixedDelay = 1000)
    public void consume() {
        List<MapRecord<String, Object, Object>> records = redisTemplate.opsForStream().read(
                Consumer.from(group, consumer),
                StreamReadOptions.empty().count(10).block(Duration.ofSeconds(2)),
                StreamOffset.create(streamKey, ReadOffset.lastConsumed())
        );
        if (records == null || records.isEmpty()) {
            return;
        }
        for (MapRecord<String, Object, Object> record : records) {
            // TODO: 调用任务处理逻辑（状态流转+PDF合并）
            redisTemplate.opsForStream().acknowledge(streamKey, group, record.getId());
        }
    }
}
```

## 6. PDF 合并服务（占位）

```java
package com.company.pdfmerge.worker.service;

import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
public class PdfMergeEngineService {
    public void merge(List<String> inputPaths, String outputPath) throws IOException {
        PDFMergerUtility utility = new PDFMergerUtility();
        for (String path : inputPaths) {
            utility.addSource(path);
        }
        utility.setDestinationFileName(outputPath);
        utility.mergeDocuments(null);
    }
}
```

## 7. 下一步实现建议

- 用 DTO 替换控制器中的 `Object` 请求体
- 接入 `PDF合并-MySQL-DDL.sql` 对应的 JPA Entity/Repository
- 增加 `downloadToken` 校验与一次性消费
- 增加重试与 DLQ 分流逻辑
