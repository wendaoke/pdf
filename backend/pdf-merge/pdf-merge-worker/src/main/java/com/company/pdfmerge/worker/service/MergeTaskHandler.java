package com.company.pdfmerge.worker.service;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import com.company.pdfmerge.common.entity.MergeTaskEntity;
import com.company.pdfmerge.common.entity.MergeTaskFileEntity;
import com.company.pdfmerge.common.enums.TaskStatus;
import com.company.pdfmerge.common.error.MergeErrorCode;
import com.company.pdfmerge.common.mapper.MergeTaskFileMapper;
import com.company.pdfmerge.common.mapper.MergeTaskMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class MergeTaskHandler {
    private final MergeTaskMapper taskMapper;
    private final MergeTaskFileMapper fileMapper;
    private final PdfMergeEngineService mergeEngineService;
    private final PdfMergeProperties properties;

    public MergeTaskHandler(MergeTaskMapper taskMapper,
                            MergeTaskFileMapper fileMapper,
                            PdfMergeEngineService mergeEngineService,
                            PdfMergeProperties properties) {
        this.taskMapper = taskMapper;
        this.fileMapper = fileMapper;
        this.mergeEngineService = mergeEngineService;
        this.properties = properties;
    }

    @Transactional
    public void handleTask(String taskId) {
        MergeTaskEntity task = taskMapper.selectByTaskId(taskId);
        if (task == null || !TaskStatus.QUEUED.name().equals(task.getStatus())) {
            return;
        }
        task.setStatus(TaskStatus.PROCESSING.name());
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.update(task);
        try {
            List<MergeTaskFileEntity> files = fileMapper.selectByTaskIdOrderByOrderIndexAsc(taskId);
            List<String> inputPaths = files.stream().map(MergeTaskFileEntity::getLocalFilePath).collect(Collectors.toList());
            Path outDir = Path.of(properties.getStorage().getRootDir(), "outputs", taskId);
            Files.createDirectories(outDir);
            Path output = outDir.resolve("merged.pdf");
            mergeEngineService.merge(inputPaths, output.toString());
            task.setStatus(TaskStatus.SUCCEEDED.name());
            task.setResultFilePath(output.toString());
            task.setResultFileName("merged.pdf");
            task.setResultSizeBytes(Files.size(output));
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.update(task);
        } catch (Exception ex) {
            task.setStatus(TaskStatus.FAILED.name());
            task.setErrorCode(MergeErrorCode.MERGE_503_ENGINE_FAILED.name());
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = ex.getClass().getSimpleName();
            }
            task.setErrorMessage(msg);
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.update(task);
        }
    }
}
