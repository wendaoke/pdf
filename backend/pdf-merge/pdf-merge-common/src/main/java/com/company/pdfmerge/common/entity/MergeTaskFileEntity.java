package com.company.pdfmerge.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "merge_task_file")
public class MergeTaskFileEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "task_id", nullable = false, length = 36)
    private String taskId;
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
    @Column(name = "file_id", nullable = false, length = 36)
    private String fileId;
    @Column(name = "origin_file_name", nullable = false, length = 255)
    private String originFileName;
    @Column(name = "local_file_path", nullable = false, length = 1024)
    private String localFilePath;
    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;
    @Column(name = "mime_type", length = 128)
    private String mimeType;
    @Column(name = "sha256", length = 64)
    private String sha256;
    @Column(name = "status", nullable = false, length = 24)
    private String status;
    @Column(name = "error_code", length = 64)
    private String errorCode;
    @Column(name = "error_message", length = 1024)
    private String errorMessage;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }
    public String getOriginFileName() { return originFileName; }
    public void setOriginFileName(String originFileName) { this.originFileName = originFileName; }
    public String getLocalFilePath() { return localFilePath; }
    public void setLocalFilePath(String localFilePath) { this.localFilePath = localFilePath; }
    public Long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public String getSha256() { return sha256; }
    public void setSha256(String sha256) { this.sha256 = sha256; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
