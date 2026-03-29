package com.company.pdfmerge.common.debug;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/** Debug NDJSON append; remove after session c61274 verified. */
public final class SessionDebugLog {
    private static final Path LOG = Path.of("D:/workspace/ai-workspace/pdf/debug-c61274.log");

    private SessionDebugLog() {}

    public static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public static void line(String hypothesisId, String location, String message, String jsonData) {
        try {
            String safeMsg = message == null ? "" : message.replace("\"", "'");
            String line = String.format(
                    "{\"sessionId\":\"c61274\",\"hypothesisId\":\"%s\",\"location\":\"%s\",\"message\":\"%s\",\"data\":%s,\"timestamp\":%d}%n",
                    hypothesisId,
                    location,
                    safeMsg,
                    jsonData == null ? "{}" : jsonData,
                    System.currentTimeMillis());
            Files.writeString(LOG, line, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        } catch (Exception ignored) {
            // debug only
        }
    }
}
