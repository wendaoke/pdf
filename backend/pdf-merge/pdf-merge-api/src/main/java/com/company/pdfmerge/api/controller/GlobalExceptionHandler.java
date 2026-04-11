package com.company.pdfmerge.api.controller;

import com.company.pdfmerge.api.model.ApiResponse;
import com.company.pdfmerge.common.config.PdfMergeProperties;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final PdfMergeProperties pdfMergeProperties;

    public GlobalExceptionHandler(PdfMergeProperties pdfMergeProperties) {
        this.pdfMergeProperties = pdfMergeProperties;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleIllegal(IllegalArgumentException ex) {
        Map<String, Object> data = new HashMap<>();
        data.put("error", ex.getMessage());
        Map<String, Object> limits = new HashMap<>();
        limits.put("N_files", pdfMergeProperties.getLimits().getNFiles());
        limits.put("S_single", pdfMergeProperties.getLimits().getSSingleBytes());
        limits.put("S_total", pdfMergeProperties.getLimits().getSTotalBytes());
        data.put("limits", limits); // 与 MergeCoreService.mergeLimitsSnapshot 字段一致
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.success(data));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleOther(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.success(Map.of("error", humanizeInternalError(ex))));
    }

    /**
     * createTask 在 DB 落库后会 XADD 到 Redis Stream；Lettuce 常把真实原因包在根异常里，顶层只有 {@code Error in execution}。
     */
    private static String humanizeInternalError(Throwable ex) {
        if (ex == null) {
            return "服务器内部错误";
        }
        Throwable root = deepestCause(ex);
        String rootMsg = root.getMessage();
        if (rootMsg != null) {
            String upper = rootMsg.toUpperCase();
            if (upper.contains("UNKNOWN COMMAND") && upper.contains("XADD")) {
                return "当前 Redis 不支持 XADD：合并任务队列依赖 Redis Stream，需要 Redis 5.0 及以上版本。请升级 127.0.0.1:6379 上的实例，或改用官方 Redis 发行版。";
            }
            if (rootMsg.contains("WRONGTYPE")) {
                return "合并任务入队失败：Redis 键类型冲突（WRONGTYPE），pdfmerge.queue.stream-key 指向的键已存在且不是 Stream。"
                        + "请在 redis-cli 对该键执行 TYPE，必要时 DEL 后重试，或改用新的 stream-key。";
            }
            if (rootMsg.contains("NOAUTH")) {
                return "Redis 认证失败，请检查 spring.data.redis.password 与实例 requirepass/ACL 是否一致（含 $ % ^ 等字符时 YAML 建议用单引号包裹）。";
            }
        }
        for (Throwable t = ex; t != null; t = t.getCause()) {
            String cn = t.getClass().getName();
            if (cn.contains("redis") && (cn.contains("Connection") || cn.contains("ConnectionFailure"))) {
                return "Redis 不可用，无法将合并任务写入队列。请启动 Redis 并检查 spring.data.redis.host、port、password 是否与实例一致。";
            }
            String m = t.getMessage();
            if (m != null) {
                if (m.contains("Unable to connect to Redis")) {
                    return "Redis 不可用，无法将合并任务写入队列。请启动 Redis 并检查 spring.data.redis 配置。";
                }
                if (m.contains("Connection refused") && m.contains("6379")) {
                    return "无法连接 Redis（6379）。请启动 Redis 服务后再创建合并任务。";
                }
            }
        }
        String top = ex.getMessage();
        if (top != null && top.contains("Error in execution")) {
            if (rootMsg != null && !rootMsg.isBlank() && !rootMsg.equals(top)) {
                String s = rootMsg.length() > 160 ? rootMsg.substring(0, 160) + "…" : rootMsg;
                return "合并任务入队失败（Redis）：" + s;
            }
            return "合并任务入队失败（Redis 命令执行异常）。请检查 pdfmerge.queue.stream-key 对应键是否被其它类型占用，或查看服务端完整堆栈。";
        }
        return top != null && !top.isBlank() ? top : "服务器内部错误";
    }

    private static Throwable deepestCause(Throwable ex) {
        Throwable t = ex;
        while (t.getCause() != null && t.getCause() != t) {
            t = t.getCause();
        }
        return t;
    }
}
