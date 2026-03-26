package com.company.pdfmerge.api.service;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import com.company.pdfmerge.common.entity.MergeDownloadTokenEntity;
import com.company.pdfmerge.common.entity.MergeTaskEntity;
import com.company.pdfmerge.common.entity.MergeTaskFileEntity;
import com.company.pdfmerge.common.enums.FileStatus;
import com.company.pdfmerge.common.enums.OwnerType;
import com.company.pdfmerge.common.enums.TaskStatus;
import com.company.pdfmerge.common.repository.MergeDownloadTokenRepository;
import com.company.pdfmerge.common.repository.MergeTaskFileRepository;
import com.company.pdfmerge.common.repository.MergeTaskRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MergeCoreService {
    private final PdfMergeProperties properties;
    private final MergeTaskRepository taskRepository;
    private final MergeTaskFileRepository taskFileRepository;
    private final MergeDownloadTokenRepository tokenRepository;
    private final StringRedisTemplate redisTemplate;
    private final Map<String, UploadSessionFile> uploadSessionStore = new ConcurrentHashMap<>();

    public MergeCoreService(PdfMergeProperties properties,
                            MergeTaskRepository taskRepository,
                            MergeTaskFileRepository taskFileRepository,
                            MergeDownloadTokenRepository tokenRepository,
                            StringRedisTemplate redisTemplate) {
        this.properties = properties;
        this.taskRepository = taskRepository;
        this.taskFileRepository = taskFileRepository;
        this.tokenRepository = tokenRepository;
        this.redisTemplate = redisTemplate;
    }

    public Map<String, Object> initUploads(String ownerId, List<Map<String, Object>> files) {
        if (files == null || files.size() < 2) {
            throw new IllegalArgumentException("至少选择2个PDF");
        }
        if (files.size() > properties.getLimits().getNFiles()) {
            throw new IllegalArgumentException("文件数量超过上限");
        }
        List<Map<String, Object>> items = new ArrayList<>();
        long total = 0;
        for (Map<String, Object> f : files) {
            String name = String.valueOf(f.get("name"));
            long size = Long.parseLong(String.valueOf(f.get("size")));
            total += size;
            if (size > properties.getLimits().getSSingleBytes()) {
                throw new IllegalArgumentException("存在文件超过单文件大小限制");
            }
            String fileId = UUID.randomUUID().toString();
            String token = "up_" + UUID.randomUUID();
            Path path = inputFilePath(fileId);
            UploadSessionFile usf = new UploadSessionFile(fileId, token, name, size, path.toString(), FileStatus.PENDING_UPLOAD.name());
            uploadSessionStore.put(ownerId + ":" + fileId, usf);
            Map<String, Object> row = new HashMap<>();
            row.put("fileId", fileId);
            row.put("localFileName", path.getFileName().toString());
            row.put("uploadToken", token);
            items.add(row);
        }
        if (total > properties.getLimits().getSTotalBytes()) {
            throw new IllegalArgumentException("总大小超过上限");
        }
        Map<String, Object> limits = new HashMap<>();
        limits.put("N_files", properties.getLimits().getNFiles());
        limits.put("S_single", properties.getLimits().getSSingleBytes());
        limits.put("S_total", properties.getLimits().getSTotalBytes());
        Map<String, Object> data = new HashMap<>();
        data.put("uploadItems", items);
        data.put("limits", limits);
        return data;
    }

    public Map<String, Object> completeUpload(String ownerId, String fileId, String uploadToken) throws IOException {
        UploadSessionFile f = uploadSessionStore.get(ownerId + ":" + fileId);
        if (f == null || !f.uploadToken.equals(uploadToken)) {
            throw new IllegalArgumentException("上传令牌无效");
        }
        Path path = Path.of(f.localFilePath);
        if (!Files.exists(path)) {
            f.status = FileStatus.FAILED.name();
            throw new IllegalArgumentException("未找到上传文件");
        }
        validatePdf(path);
        f.status = FileStatus.READY.name();
        Map<String, Object> data = new HashMap<>();
        data.put("status", f.status);
        return data;
    }

    @Transactional
    public Map<String, Object> createTask(String ownerId, List<Map<String, Object>> files) {
        String taskId = UUID.randomUUID().toString();
        List<Map<String, Object>> ordered = new ArrayList<>(files);
        ordered.sort(Comparator.comparingInt(m -> Integer.parseInt(String.valueOf(m.get("orderIndex")))));
        long totalSize = 0;
        List<MergeTaskFileEntity> entities = new ArrayList<>();
        for (Map<String, Object> row : ordered) {
            String fileId = String.valueOf(row.get("fileId"));
            int orderIndex = Integer.parseInt(String.valueOf(row.get("orderIndex")));
            UploadSessionFile usf = uploadSessionStore.get(ownerId + ":" + fileId);
            if (usf == null || !FileStatus.READY.name().equals(usf.status)) {
                throw new IllegalArgumentException("存在未完成上传文件");
            }
            totalSize += usf.size;
            MergeTaskFileEntity entity = new MergeTaskFileEntity();
            entity.setTaskId(taskId);
            entity.setOrderIndex(orderIndex);
            entity.setFileId(fileId);
            entity.setOriginFileName(usf.originName);
            entity.setLocalFilePath(usf.localFilePath);
            entity.setSizeBytes(usf.size);
            entity.setStatus(FileStatus.READY.name());
            entity.setCreatedAt(Instant.now());
            entity.setUpdatedAt(Instant.now());
            entities.add(entity);
        }
        MergeTaskEntity task = new MergeTaskEntity();
        task.setTaskId(taskId);
        task.setOwnerType(OwnerType.ANON.name());
        task.setOwnerId(ownerId);
        task.setStatus(TaskStatus.QUEUED.name());
        task.setFileCount(entities.size());
        task.setTotalSizeBytes(totalSize);
        task.setRetryCount(0);
        task.setVersion(0);
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        taskFileRepository.saveAll(entities);

        Map<String, String> message = new HashMap<>();
        message.put("taskId", taskId);
        message.put("ownerId", ownerId);
        message.put("ownerType", OwnerType.ANON.name());
        message.put("retryCount", "0");
        message.put("createdAt", Instant.now().toString());
        message.put("traceId", UUID.randomUUID().toString());
        redisTemplate.opsForStream().add(MapRecord.create(properties.getQueue().getStreamKey(), message));

        Map<String, Object> data = new HashMap<>();
        data.put("taskId", taskId);
        data.put("status", TaskStatus.QUEUED.name());
        return data;
    }

    public Map<String, Object> getTask(String ownerId, String taskId) {
        MergeTaskEntity task = taskRepository.findByTaskIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        Map<String, Object> data = new HashMap<>();
        data.put("taskId", task.getTaskId());
        data.put("status", task.getStatus());
        data.put("errorCode", task.getErrorCode());
        data.put("errorMessage", task.getErrorMessage());
        if (TaskStatus.SUCCEEDED.name().equals(task.getStatus())) {
            Map<String, Object> result = new HashMap<>();
            result.put("fileName", task.getResultFileName());
            result.put("sizeBytes", task.getResultSizeBytes());
            data.put("result", result);
        } else {
            data.put("result", null);
        }
        return data;
    }

    @Transactional
    public Map<String, Object> createDownloadToken(String ownerId, String taskId) {
        MergeTaskEntity task = taskRepository.findByTaskIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        if (!TaskStatus.SUCCEEDED.name().equals(task.getStatus())) {
            throw new IllegalArgumentException("任务尚未成功");
        }
        MergeDownloadTokenEntity token = new MergeDownloadTokenEntity();
        token.setToken("dl_" + UUID.randomUUID());
        token.setTaskId(taskId);
        token.setOwnerId(ownerId);
        token.setUsed(0);
        token.setCreatedAt(Instant.now());
        token.setExpireAt(Instant.now().plusSeconds(properties.getDownload().getTokenExpireMinutes() * 60L));
        tokenRepository.save(token);
        Map<String, Object> data = new HashMap<>();
        data.put("downloadToken", token.getToken());
        data.put("expireAt", token.getExpireAt().toString());
        return data;
    }

    @Transactional
    public Path verifyDownload(String ownerId, String taskId, String token) {
        MergeDownloadTokenEntity entity = tokenRepository
                .findByTokenAndTaskIdAndOwnerId(token, taskId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("下载令牌无效"));
        if (entity.getUsed() == 1 || entity.getExpireAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("下载令牌已失效");
        }
        MergeTaskEntity task = taskRepository.findByTaskIdAndOwnerId(taskId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("任务不存在"));
        entity.setUsed(1);
        tokenRepository.save(entity);
        return Path.of(task.getResultFilePath());
    }

    private Path inputFilePath(String fileId) {
        Path dir = Path.of(properties.getStorage().getRootDir(), "uploads");
        return dir.resolve(fileId + ".pdf");
    }

    private void validatePdf(Path path) throws IOException {
        try (InputStream in = Files.newInputStream(path)) {
            byte[] magic = in.readNBytes(4);
            if (magic.length < 4 || magic[0] != 0x25 || magic[1] != 0x50 || magic[2] != 0x44 || magic[3] != 0x46) {
                throw new IllegalArgumentException("MERGE_400_PDF_INVALID");
            }
        }
        try (PDDocument document = Loader.loadPDF(path.toFile())) {
            if (document.isEncrypted()) {
                throw new IllegalArgumentException("MERGE_400_ENCRYPTED_UNSUPPORTED");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("MERGE_422_PDF_CORRUPTED");
        }
    }

    private static class UploadSessionFile {
        private final String fileId;
        private final String uploadToken;
        private final String originName;
        private final long size;
        private final String localFilePath;
        private String status;

        private UploadSessionFile(String fileId, String uploadToken, String originName, long size, String localFilePath, String status) {
            this.fileId = fileId;
            this.uploadToken = uploadToken;
            this.originName = originName;
            this.size = size;
            this.localFilePath = localFilePath;
            this.status = status;
        }
    }
}
