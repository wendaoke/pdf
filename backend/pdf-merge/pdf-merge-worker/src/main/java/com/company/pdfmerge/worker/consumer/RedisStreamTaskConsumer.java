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
        } catch (Exception ignored) {
            // already exists
        }
    }

    @Scheduled(fixedDelay = 1000)
    public void consume() {
        List<MapRecord<String, Object, Object>> records = redisTemplate.opsForStream().read(
                Consumer.from(properties.getQueue().getConsumerGroup(), properties.getQueue().getConsumerName()),
                StreamReadOptions.empty()
                        .count(properties.getQueue().getReadCount())
                        .block(Duration.ofMillis(properties.getQueue().getBlockMs())),
                StreamOffset.create(properties.getQueue().getStreamKey(), ReadOffset.lastConsumed())
        );
        if (records == null || records.isEmpty()) {
            return;
        }
        for (MapRecord<String, Object, Object> record : records) {
            try {
                Object taskId = record.getValue().get("taskId");
                if (taskId != null) {
                    taskHandler.handleTask(taskId.toString());
                }
                redisTemplate.opsForStream().acknowledge(properties.getQueue().getStreamKey(), properties.getQueue().getConsumerGroup(), record.getId());
            } catch (Exception ex) {
                // keep pending for retry
            }
        }
    }
}
