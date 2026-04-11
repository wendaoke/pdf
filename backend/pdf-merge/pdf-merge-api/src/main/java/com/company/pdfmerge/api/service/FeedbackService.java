package com.company.pdfmerge.api.service;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import com.company.pdfmerge.common.entity.UserFeedbackEntity;
import com.company.pdfmerge.common.mapper.UserFeedbackMapper;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {
    private static final List<String> ALLOWED_CATEGORIES = List.of("merge", "upload", "other");
    private static final List<String> CONTEXT_KEYS = List.of("pagePath", "userAgent", "taskId", "clientVersion");

    private final PdfMergeProperties properties;
    private final UserFeedbackMapper userFeedbackMapper;

    public FeedbackService(PdfMergeProperties properties, UserFeedbackMapper userFeedbackMapper) {
        this.properties = properties;
        this.userFeedbackMapper = userFeedbackMapper;
    }

    @Transactional
    public Map<String, Object> submitFeedback(String ownerId, Map<String, Object> body) {
        if (body == null) {
            throw new IllegalArgumentException("请求体不能为空");
        }
        Object rawContent = body.get("content");
        if (!(rawContent instanceof String) || ((String) rawContent).isBlank()) {
            throw new IllegalArgumentException("请填写问题描述");
        }
        String content = ((String) rawContent).trim();
        int maxCp = properties.getFeedback().getMaxContentChars();
        if (content.codePointCount(0, content.length()) > maxCp) {
            throw new IllegalArgumentException("问题描述过长，最多 " + maxCp + " 个字符");
        }

        String contact = null;
        Object c = body.get("contact");
        if (c instanceof String && !((String) c).isBlank()) {
            contact = truncate((String) c, 128);
        }

        String category = null;
        Object cat = body.get("category");
        if (cat instanceof String && !((String) cat).isBlank()) {
            String cv = ((String) cat).trim().toLowerCase();
            if (!ALLOWED_CATEGORIES.contains(cv)) {
                throw new IllegalArgumentException("问题类型无效，可选：merge、upload、other");
            }
            category = cv;
        }

        Map<String, Object> safeContext = new LinkedHashMap<>();
        Object ctxObj = body.get("context");
        if (ctxObj instanceof Map<?, ?> rawMap) {
            for (String key : CONTEXT_KEYS) {
                Object v = rawMap.get(key);
                if (v == null) {
                    continue;
                }
                String s = String.valueOf(v).trim();
                if (s.isEmpty()) {
                    continue;
                }
                int cap = "userAgent".equals(key) || "pagePath".equals(key) ? 512 : "taskId".equals(key) ? 40 : 64;
                safeContext.put(key, truncate(s, cap));
            }
        }
        safeContext.put("receivedAt", Instant.now().toString());

        UserFeedbackEntity row = new UserFeedbackEntity();
        row.setOwnerId(ownerId != null && !ownerId.isBlank() ? ownerId.trim() : null);
        row.setContact(contact);
        row.setCategory(category);
        row.setContent(content);
        row.setContextJson(toJsonString(safeContext));
        row.setStatus("NEW");
        LocalDateTime now = LocalDateTime.now();
        row.setCreatedAt(now);
        row.setUpdatedAt(now);
        userFeedbackMapper.insert(row);
        if (row.getId() == null) {
            throw new IllegalStateException("反馈保存失败");
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("feedbackId", row.getId());
        return data;
    }

    private static String truncate(String s, int maxChars) {
        if (s == null) {
            return null;
        }
        if (s.codePointCount(0, s.length()) <= maxChars) {
            return s;
        }
        return s.substring(0, s.offsetByCodePoints(0, maxChars));
    }

    /** Minimal JSON object for string values only (MVP). */
    private static String toJsonString(Map<String, Object> map) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) {
                sb.append(',');
            }
            first = false;
            sb.append('"').append(jsonEscape(e.getKey())).append("\":");
            Object v = e.getValue();
            if (v == null) {
                sb.append("null");
            } else {
                sb.append('"').append(jsonEscape(String.valueOf(v))).append('"');
            }
        }
        sb.append('}');
        return sb.toString();
    }

    private static String jsonEscape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
