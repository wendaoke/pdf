package com.company.pdfmerge.worker.consumer;

import com.company.pdfmerge.common.config.PdfMergeProperties;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RedisStreamTaskConsumer {
    private static final Logger log = LoggerFactory.getLogger(RedisStreamTaskConsumer.class);
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
        } catch (Exception ex) {
            // BUSYGROUP etc. — already exists
        }
    }

    @Scheduled(fixedDelay = 1000)
    public void consume() {
        long blockMs = properties.getQueue().getBlockMs();
        List<MapRecord<String, Object, Object>> records;
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
            log.warn("Redis stream XREADGROUP failed (check auth/host/stream): {}", ex.toString());
            return;
        }
        if (records == null || records.isEmpty()) {
            return;
        }
        for (MapRecord<String, Object, Object> record : records) {
            try {
                Object taskId = record.getValue().get("taskId");
                if (taskId != null) {
                    taskHandler.handleTask(taskId.toString());
                }
                try {
                    redisTemplate
                            .opsForStream()
                            .acknowledge(
                                    properties.getQueue().getStreamKey(),
                                    properties.getQueue().getConsumerGroup(),
                                    record.getId());
                } catch (Exception ignored) {
                    // ignore ack failure
                }
            } catch (Exception ex) {
                log.warn("merge stream record handling failed, message left pending for retry: {}", ex.toString());
            }
        }
    }
}
