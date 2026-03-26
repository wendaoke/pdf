package com.company.pdfmerge.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "merge_download_token")
public class MergeDownloadTokenEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "token", nullable = false, length = 128)
    private String token;
    @Column(name = "task_id", nullable = false, length = 36)
    private String taskId;
    @Column(name = "owner_id", nullable = false, length = 64)
    private String ownerId;
    @Column(name = "expire_at", nullable = false)
    private Instant expireAt;
    @Column(name = "used", nullable = false)
    private Integer used;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getTaskId() { return taskId; }
    public void setTaskId(String taskId) { this.taskId = taskId; }
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    public Instant getExpireAt() { return expireAt; }
    public void setExpireAt(Instant expireAt) { this.expireAt = expireAt; }
    public Integer getUsed() { return used; }
    public void setUsed(Integer used) { this.used = used; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
