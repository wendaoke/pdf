package com.company.pdfmerge.worker.service;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import com.company.pdfmerge.common.entity.MergeTaskEntity;
import com.company.pdfmerge.common.entity.MergeTaskFileEntity;
import com.company.pdfmerge.common.enums.TaskStatus;
import com.company.pdfmerge.common.error.MergeErrorCode;
import com.company.pdfmerge.common.repository.MergeTaskFileRepository;
import com.company.pdfmerge.common.repository.MergeTaskRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MergeTaskHandler {
    private final MergeTaskRepository taskRepository;
    private final MergeTaskFileRepository fileRepository;
    private final PdfMergeEngineService mergeEngineService;
    private final PdfMergeProperties properties;

    public MergeTaskHandler(MergeTaskRepository taskRepository,
                            MergeTaskFileRepository fileRepository,
                            PdfMergeEngineService mergeEngineService,
                            PdfMergeProperties properties) {
        this.taskRepository = taskRepository;
        this.fileRepository = fileRepository;
        this.mergeEngineService = mergeEngineService;
        this.properties = properties;
    }

    @Transactional
    public void handleTask(String taskId) {
        MergeTaskEntity task = taskRepository.findById(taskId).orElse(null);
        if (task == null || !TaskStatus.QUEUED.name().equals(task.getStatus())) {
            return;
        }
        task.setStatus(TaskStatus.PROCESSING.name());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        try {
            List<MergeTaskFileEntity> files = fileRepository.findByTaskIdOrderByOrderIndexAsc(taskId);
            List<String> inputPaths = files.stream().map(MergeTaskFileEntity::getLocalFilePath).collect(Collectors.toList());
            Path outDir = Path.of(properties.getStorage().getRootDir(), "outputs", taskId);
            Files.createDirectories(outDir);
            Path output = outDir.resolve("merged.pdf");
            mergeEngineService.merge(inputPaths, output.toString());
            task.setStatus(TaskStatus.SUCCEEDED.name());
            task.setResultFilePath(output.toString());
            task.setResultFileName("merged.pdf");
            task.setResultSizeBytes(Files.size(output));
            task.setUpdatedAt(Instant.now());
            taskRepository.save(task);
        } catch (Exception ex) {
            task.setStatus(TaskStatus.FAILED.name());
            task.setErrorCode(MergeErrorCode.MERGE_503_ENGINE_FAILED.name());
            task.setErrorMessage(ex.getMessage());
            task.setUpdatedAt(Instant.now());
            taskRepository.save(task);
        }
    }
}
