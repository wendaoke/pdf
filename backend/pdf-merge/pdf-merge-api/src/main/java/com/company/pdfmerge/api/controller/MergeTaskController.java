package com.company.pdfmerge.api.controller;

import com.company.pdfmerge.api.model.ApiResponse;
import com.company.pdfmerge.api.service.MergeCoreService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/pdf/merge")
public class MergeTaskController {
    private final MergeCoreService mergeCoreService;

    public MergeTaskController(MergeCoreService mergeCoreService) {
        this.mergeCoreService = mergeCoreService;
    }

    /** 公开当前合并上限，便于前端在 init 失败（旧版 400 体无 limits）时仍能展示「最多 N 个」 */
    @GetMapping("/limits")
    public ApiResponse<Map<String, Object>> mergeLimits() {
        return ApiResponse.success(mergeCoreService.mergeLimitsSnapshot());
    }

    @PostMapping("/uploads:init")
    public ApiResponse<Map<String, Object>> initUploads(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                         @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> files = (List<Map<String, Object>>) request.get("files");
        return ApiResponse.success(mergeCoreService.initUploads(normalizeOwner(ownerId), files));
    }

    @PostMapping(value = "/uploads:put", consumes = {MediaType.APPLICATION_PDF_VALUE, MediaType.APPLICATION_OCTET_STREAM_VALUE})
    public ApiResponse<Map<String, Object>> uploadPut(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                       @RequestParam("fileId") String fileId,
                                                       @RequestParam("uploadToken") String uploadToken,
                                                       InputStream body) throws IOException {
        return ApiResponse.success(mergeCoreService.receiveUpload(
                normalizeOwner(ownerId), fileId, uploadToken, body));
    }

    @PostMapping("/uploads:complete")
    public ApiResponse<Map<String, Object>> completeUpload(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                            @RequestBody Map<String, Object> request) throws IOException {
        return ApiResponse.success(mergeCoreService.completeUpload(
                normalizeOwner(ownerId),
                String.valueOf(request.get("fileId")),
                String.valueOf(request.get("uploadToken"))));
    }

    @PostMapping("/tasks")
    public ApiResponse<Map<String, Object>> createTask(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                        @RequestBody Map<String, Object> request) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> files = (List<Map<String, Object>>) request.get("files");
        return ApiResponse.success(mergeCoreService.createTask(normalizeOwner(ownerId), files));
    }

    @GetMapping("/tasks/{taskId}")
    public ApiResponse<Map<String, Object>> getTask(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                     @PathVariable("taskId") String taskId) {
        return ApiResponse.success(mergeCoreService.getTask(normalizeOwner(ownerId), taskId));
    }

    @PostMapping("/tasks/{taskId}/download-token")
    public ApiResponse<Map<String, Object>> createDownloadToken(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                                 @PathVariable("taskId") String taskId) {
        return ApiResponse.success(mergeCoreService.createDownloadToken(normalizeOwner(ownerId), taskId));
    }

    @GetMapping("/tasks/{taskId}/download")
    public ResponseEntity<InputStreamResource> download(@RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
                                                        @PathVariable("taskId") String taskId,
                                                        @RequestParam("token") String token) throws IOException {
        MergeCoreService.DownloadTarget target =
                mergeCoreService.verifyDownload(normalizeOwner(ownerId), taskId, token);
        Path path = target.path();
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(target.fileName(), StandardCharsets.UTF_8)
                .build();
        InputStreamResource resource = new InputStreamResource(Files.newInputStream(path));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    private String normalizeOwner(String ownerId) {
        return (ownerId == null || ownerId.isBlank()) ? "anon_local" : ownerId.trim();
    }
}
