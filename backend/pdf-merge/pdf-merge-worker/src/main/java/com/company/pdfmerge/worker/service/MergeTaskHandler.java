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

@Component
public class MergeTaskHandler {
    private final MergeTaskMapper taskMapper;
    private final MergeTaskFileMapper fileMapper;
    private final PdfMergeEngineService mergeEngineService;
    private final MergeTaskProgressService mergeTaskProgressService;
    private final PdfMergeProperties properties;

    public MergeTaskHandler(MergeTaskMapper taskMapper,
                            MergeTaskFileMapper fileMapper,
                            PdfMergeEngineService mergeEngineService,
                            MergeTaskProgressService mergeTaskProgressService,
                            PdfMergeProperties properties) {
        this.taskMapper = taskMapper;
        this.fileMapper = fileMapper;
        this.mergeEngineService = mergeEngineService;
        this.mergeTaskProgressService = mergeTaskProgressService;
        this.properties = properties;
    }

    public void handleTask(String taskId) {
        MergeTaskEntity task = taskMapper.selectByTaskId(taskId);
        if (task == null || !TaskStatus.QUEUED.name().equals(task.getStatus())) {
            return;
        }
        task.setStatus(TaskStatus.PROCESSING.name());
        task.setMergeProgressDone(0);
        task.setMergeProgressIndex(null);
        task.setMergeProgressName(null);
        task.setUpdatedAt(LocalDateTime.now());
        taskMapper.update(task);
        try {
            List<MergeTaskFileEntity> files = fileMapper.selectByTaskIdOrderByOrderIndexAsc(taskId);
            List<MergeSourceEntry> sources = files.stream()
                    .map(f -> new MergeSourceEntry(f.getLocalFilePath(), f.getOrderIndex(), f.getOriginFileName()))
                    .collect(Collectors.toList());
            Path outDir = Path.of(properties.getStorage().getRootDir(), "outputs", taskId);
            Files.createDirectories(outDir);
            String resultFileName = "合并-" + System.currentTimeMillis() + ".pdf";
            Path output = outDir.resolve(resultFileName);
            mergeEngineService.merge(sources, output.toString(), (done, idx, name) ->
                    mergeTaskProgressService.updateMergeProgress(taskId, done, idx, name));
            task.setStatus(TaskStatus.SUCCEEDED.name());
            task.setResultFilePath(output.toString());
            task.setResultFileName(resultFileName);
            task.setResultSizeBytes(Files.size(output));
            task.setMergeProgressDone(task.getFileCount());
            task.setMergeProgressIndex(null);
            task.setMergeProgressName(null);
            task.setUpdatedAt(LocalDateTime.now());
            taskMapper.update(task);
        } catch (Exception ex) {
            MergeTaskEntity latest = taskMapper.selectByTaskId(taskId);
            if (latest == null) {
                return;
            }
            latest.setStatus(TaskStatus.FAILED.name());
            latest.setErrorCode(MergeErrorCode.MERGE_503_ENGINE_FAILED.name());
            String msg = ex.getMessage();
            if (msg == null || msg.isBlank()) {
                msg = ex.getClass().getSimpleName();
            }
            latest.setErrorMessage(msg);
            latest.setUpdatedAt(LocalDateTime.now());
            taskMapper.update(latest);
        }
    }
}
