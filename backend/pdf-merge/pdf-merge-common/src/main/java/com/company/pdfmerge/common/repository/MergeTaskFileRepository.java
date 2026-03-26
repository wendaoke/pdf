package com.company.pdfmerge.common.repository;

import com.company.pdfmerge.common.entity.MergeTaskFileEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MergeTaskFileRepository extends JpaRepository<MergeTaskFileEntity, Long> {
    Optional<MergeTaskFileEntity> findByFileId(String fileId);
    List<MergeTaskFileEntity> findByTaskIdOrderByOrderIndexAsc(String taskId);
}
