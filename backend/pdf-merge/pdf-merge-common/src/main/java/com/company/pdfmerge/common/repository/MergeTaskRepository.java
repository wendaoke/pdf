package com.company.pdfmerge.common.repository;

import com.company.pdfmerge.common.entity.MergeTaskEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MergeTaskRepository extends JpaRepository<MergeTaskEntity, String> {
    Optional<MergeTaskEntity> findByTaskIdAndOwnerId(String taskId, String ownerId);
}
