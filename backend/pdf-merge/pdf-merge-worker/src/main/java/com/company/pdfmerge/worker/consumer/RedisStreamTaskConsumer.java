package com.company.pdfmerge.worker.consumer;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import com.company.pdfmerge.common.debug.SessionDebugLog;
import com.company.pdfmerge.worker.service.MergeTaskHandler;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.connection.stream.StreamReadOptions;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RedisStreamTaskConsumer {
    private final StringRedisTemplate redisTemplate;
    private final PdfMergeProperties properties;
    private final MergeTaskHandler taskHandler;

    public RedisStreamTaskConsumer(StringRedisTemplate redisTemplate,
                                   PdfMergeProperties properties,
                                   MergeTaskHandler taskHandler) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
        this.taskHandler = taskHandler;
    }

    @PostConstruct
    public void initGroup() {
        try {
            redisTemplate.opsForStream()
                    .createGroup(properties.getQueue().getStreamKey(), ReadOffset.latest(), properties.getQueue().getConsumerGroup());
            // #region agent log
            SessionDebugLog.line("H5", "RedisStreamTaskConsumer.initGroup", "createGroupOk", "{}");
            // #endregion
        } catch (Exception ex) {
            // #region agent log
            SessionDebugLog.line(
                    "H5",
                    "RedisStreamTaskConsumer.initGroup",
                    "createGroupCatch",
                    String.format(
                            "{\"error\":\"%s\"}", SessionDebugLog.esc(ex.getMessage())));
            // #endregion
            // BUSYGROUP etc. — already exists
        }
    }

    @Scheduled(fixedDelay = 1000)
    public void consume() {
        long blockMs = properties.getQueue().getBlockMs();
        long t0 = System.currentTimeMillis();
        List<MapRecord<String, Object, Object>> records;
        // #region agent log
        try {
            records =
                    redisTemplate
                            .opsForStream()
                            .read(
                                    Consumer.from(
                                            properties.getQueue().getConsumerGroup(),
                                            properties.getQueue().getConsumerName()),
                                    StreamReadOptions.empty()
                                            .count(properties.getQueue().getReadCount())
                                            .block(Duration.ofMillis(blockMs)),
                                    StreamOffset.create(
                                            properties.getQueue().getStreamKey(), ReadOffset.lastConsumed()));
        } catch (Exception ex) {
            long elapsed = System.currentTimeMillis() - t0;
            SessionDebugLog.line(
                    "H1",
                    "RedisStreamTaskConsumer.consume",
                    "xreadgroupFailed",
                    String.format(
                            "{\"blockMs\":%d,\"elapsedMs\":%d,\"error\":\"%s\",\"errorType\":\"%s\"}",
                            blockMs,
                            elapsed,
                            SessionDebugLog.esc(ex.getMessage()),
                            SessionDebugLog.esc(ex.getClass().getSimpleName())));
            return;
        }
        long elapsedAfterRead = System.currentTimeMillis() - t0;
        int recordCount = records == null ? -1 : records.size();
        SessionDebugLog.line(
                "H1",
                "RedisStreamTaskConsumer.consume",
                "xreadgroupOk",
                String.format(
                        "{\"blockMs\":%d,\"elapsedMs\":%d,\"recordCount\":%d}",
                        blockMs, elapsedAfterRead, recordCount));
        // #endregion
        if (records == null || records.isEmpty()) {
            return;
        }
        for (MapRecord<String, Object, Object> record : records) {
            try {
                Object taskId = record.getValue().get("taskId");
                if (taskId != null) {
                    taskHandler.handleTask(taskId.toString());
                }
                long ta = System.currentTimeMillis();
                // #region agent log
                try {
                    redisTemplate
                            .opsForStream()
                            .acknowledge(
                                    properties.getQueue().getStreamKey(),
                                    properties.getQueue().getConsumerGroup(),
                                    record.getId());
                    SessionDebugLog.line(
                            "H3",
                            "RedisStreamTaskConsumer.consume",
                            "ackOk",
                            String.format(
                                    "{\"ackElapsedMs\":%d}", System.currentTimeMillis() - ta));
                } catch (Exception ackEx) {
                    SessionDebugLog.line(
                            "H3",
                            "RedisStreamTaskConsumer.consume",
                            "ackFailed",
                            String.format(
                                    "{\"error\":\"%s\"}", SessionDebugLog.esc(ackEx.getMessage())));
                }
                // #endregion
            } catch (Exception ex) {
                // keep pending for retry
            }
        }
    }
}
