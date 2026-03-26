package com.company.pdfmerge.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "merge_task")
public class MergeTaskEntity {
    @Id
    @Column(name = "task_id", nullable = false, length = 36)
    private String taskId;
    @Column(name = "owner_type", nullable = false, length = 16)
    private String ownerType;
    @Column(name = "owner_id", nullable = false, length = 64)
    private String ownerId;
    @Column(name = "status", nullable = false, length = 16)
    private String status;
    @Column(name = "file_count", nullable = false)
    private Integer fileCount;
    @Column(name = "total_size_bytes", nullable = false)
    private Long totalSizeBytes;
    @Column(name = "result_file_path", length = 1024)
    private String resultFilePath;
    @Column(name = "result_file_name", length = 255)
    private String resultFileName;
    @Column(name = "result_size_bytes")
    private Long resultSizeBytes;
    @Column(name = "error_code", length = 64)
    private String errorCode;
    @Column(name = "error_message", length = 1024)
    private String errorMessage;
    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;
    @Column(name = "version", nullable = false)
    private Integer version = 0;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    @Column(name = "expired_at")
    private Instant expiredAt;

    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String ownerType) { this.ownerType = ownerType; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getFileCount() { return fileCount; }
    public void setFileCount(Integer fileCount) { this.fileCount = fileCount; }
    public Long getTotalSizeBytes() { return totalSizeBytes; }
    public void setTotalSizeBytes(Long totalSizeBytes) { this.totalSizeBytes = totalSizeBytes; }
    public String getResultFilePath() { return resultFilePath; }
    public void setResultFilePath(String resultFilePath) { this.resultFilePath = resultFilePath; }
    public String getResultFileName() { return resultFileName; }
    public void setResultFileName(String resultFileName) { this.resultFileName = resultFileName; }
    public Long getResultSizeBytes() { return resultSizeBytes; }
    public void setResultSizeBytes(Long resultSizeBytes) { this.resultSizeBytes = resultSizeBytes; }
    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getExpiredAt() { return expiredAt; }
    public void setExpiredAt(Instant expiredAt) { this.expiredAt = expiredAt; }
}
