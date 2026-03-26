package com.company.pdfmerge.common.repository;

import com.company.pdfmerge.common.entity.MergeDownloadTokenEntity;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MergeDownloadTokenRepository extends JpaRepository<MergeDownloadTokenEntity, Long> {
    Optional<MergeDownloadTokenEntity> findByTokenAndTaskIdAndOwnerId(String token, String taskId, String ownerId);
    long countByExpireAtBeforeAndUsed(Instant expireAt, Integer used);
}
