package com.company.pdfmerge.worker.service;

import com.company.pdfmerge.common.mapper.MergeTaskMapper;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MergeTaskProgressService {
    private final MergeTaskMapper taskMapper;

    public MergeTaskProgressService(MergeTaskMapper taskMapper) {
        this.taskMapper = taskMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateMergeProgress(String taskId, int mergeProgressDone, Integer mergeProgressIndex, String mergeProgressName) {
        taskMapper.updateMergeProgress(taskId, mergeProgressDone, mergeProgressIndex, mergeProgressName, LocalDateTime.now());
    }
}
