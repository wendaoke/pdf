package com.company.pdfmerge.common.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pdfmerge")
public class PdfMergeProperties {
    private final Limits limits = new Limits();
    private final Storage storage = new Storage();
    private final Queue queue = new Queue();
    private final Download download = new Download();
    private final Merge merge = new Merge();
    private final Cors cors = new Cors();
    private final Feedback feedback = new Feedback();

    public Limits getLimits() {
        return limits;
    }

    public Storage getStorage() {
        return storage;
    }

    public Queue getQueue() {
        return queue;
    }

    public Download getDownload() {
        return download;
    }

    public Merge getMerge() {
        return merge;
    }

    public Cors getCors() {
        return cors;
    }

    public Feedback getFeedback() {
        return feedback;
    }

    /** Browser CORS for separate frontend origin (e.g. Next.js on port 3000). */
    public static class Cors {
        private List<String> allowedOriginPatterns = new ArrayList<>(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:*",
                "http://127.0.0.1:*"));

        public List<String> getAllowedOriginPatterns() {
            return allowedOriginPatterns;
        }

        public void setAllowedOriginPatterns(List<String> allowedOriginPatterns) {
            this.allowedOriginPatterns = allowedOriginPatterns;
        }
    }

    public static class Limits {
        private int nFiles = 20;
        private long sSingleBytes = 50L * 1024 * 1024;
        private long sTotalBytes = 200L * 1024 * 1024;

        public int getNFiles() { return nFiles; }
        public void setNFiles(int nFiles) { this.nFiles = nFiles; }
        public long getSSingleBytes() { return sSingleBytes; }
        public void setSSingleBytes(long sSingleBytes) { this.sSingleBytes = sSingleBytes; }
        public long getSTotalBytes() { return sTotalBytes; }
        public void setSTotalBytes(long sTotalBytes) { this.sTotalBytes = sTotalBytes; }
    }

    public static class Storage {
        private String rootDir = "data/pdf-merge";
        public String getRootDir() { return rootDir; }
        public void setRootDir(String rootDir) { this.rootDir = rootDir; }
    }

    public static class Queue {
        private String streamKey = "stream:pdf:merge:task";
        private String dlqStreamKey = "stream:pdf:merge:task:dlq";
        private String consumerGroup = "merge_worker_group";
        private String consumerName = "worker-local";
        private int readCount = 10;
        private long blockMs = 2000;
        private int maxRetry = 2;

        public String getStreamKey() { return streamKey; }
        public void setStreamKey(String streamKey) { this.streamKey = streamKey; }
        public String getDlqStreamKey() { return dlqStreamKey; }
        public void setDlqStreamKey(String dlqStreamKey) { this.dlqStreamKey = dlqStreamKey; }
        public String getConsumerGroup() { return consumerGroup; }
        public void setConsumerGroup(String consumerGroup) { this.consumerGroup = consumerGroup; }
        public String getConsumerName() { return consumerName; }
        public void setConsumerName(String consumerName) { this.consumerName = consumerName; }
        public int getReadCount() { return readCount; }
        public void setReadCount(int readCount) { this.readCount = readCount; }
        public long getBlockMs() { return blockMs; }
        public void setBlockMs(long blockMs) { this.blockMs = blockMs; }
        public int getMaxRetry() { return maxRetry; }
        public void setMaxRetry(int maxRetry) { this.maxRetry = maxRetry; }
    }

    public static class Download {
        private int tokenExpireMinutes = 15;
        public int getTokenExpireMinutes() { return tokenExpireMinutes; }
        public void setTokenExpireMinutes(int tokenExpireMinutes) { this.tokenExpireMinutes = tokenExpireMinutes; }
    }

    public static class Merge {
        private int timeoutSeconds = 120;
        public int getTimeoutSeconds() { return timeoutSeconds; }
        public void setTimeoutSeconds(int timeoutSeconds) { this.timeoutSeconds = timeoutSeconds; }
    }

    public static class Feedback {
        /** Max UTF-16 code units for feedback content (MVP). */
        private int maxContentChars = 2000;

        public int getMaxContentChars() {
            return maxContentChars;
        }

        public void setMaxContentChars(int maxContentChars) {
            this.maxContentChars = maxContentChars;
        }
    }
}
