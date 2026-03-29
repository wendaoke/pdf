"use client";

import { Alert, Button, Card, Space, message } from "antd";
import { createDownloadToken, createTask, initUploads, parseMergeApiError, uploadPdfPut } from "@/features/pdf-merge/api/mergeApi";
import { FileListSortable } from "@/features/pdf-merge/components/FileListSortable";
import { MergeProgress } from "@/features/pdf-merge/components/MergeProgress";
import { MergeResultPanel } from "@/features/pdf-merge/components/MergeResultPanel";
import { UploadDropzone } from "@/features/pdf-merge/components/UploadDropzone";
import { useMergePolling } from "@/features/pdf-merge/hooks/useMergePolling";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";
import type { MergeTaskViewModel, TaskStatus } from "@/features/pdf-merge/types/merge.types";
import { getErrorMessage } from "@/features/pdf-merge/utils/errorCodeMap";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";

export default function MergePage() {
  const router = useRouter();
  const { files, setFiles, removeFile, task, setTask, reset } = useMergeStore();
  const readyFiles = files.filter((f) => f.status === "READY");
  const canSubmit = readyFiles.length >= 2 && !files.some((f) => f.status === "UPLOADING");

  const polling = useMergePolling(task.taskId, task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING");

  useEffect(() => {
    if (!polling.isError || !task.taskId) return;
    if (task.taskStatus !== "QUEUED" && task.taskStatus !== "PROCESSING") return;
    const detail = parseMergeApiError(polling.error);
    setTask({
      taskStatus: "FAILED",
      errorMessage: detail,
      errorCode: undefined,
      stageText: undefined
    });
  }, [polling.isError, polling.error, task.taskId, task.taskStatus, setTask]);

  useEffect(() => {
    const d = polling.data;
    if (!d?.status) return;
    const statusChanged = d.status !== task.taskStatus;
    const failedMetaCatchUp =
      d.status === "FAILED" &&
      task.taskStatus === "FAILED" &&
      ((Boolean(d.errorCode) && d.errorCode !== task.errorCode) ||
        (Boolean(d.errorMessage) && d.errorMessage !== task.errorMessage));
    if (!statusChanged && !failedMetaCatchUp) return;

    const patch: Partial<MergeTaskViewModel> = { taskStatus: d.status as TaskStatus };
    if (d.status === "SUCCEEDED" && d.result?.fileName) {
      patch.resultFileName = d.result.fileName;
    } else if (statusChanged) {
      patch.resultFileName = undefined;
    }
    if (d.status === "FAILED") {
      if (d.errorCode !== undefined) patch.errorCode = d.errorCode;
      if (d.errorMessage !== undefined) patch.errorMessage = d.errorMessage;
    } else if (statusChanged) {
      patch.errorCode = undefined;
      patch.errorMessage = undefined;
    }

    setTask(patch);
  }, [polling.data, setTask, task.taskStatus, task.errorCode, task.errorMessage]);

  const handleSelect = async (picked: File[]) => {
    const onlyPdf = picked.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (onlyPdf.length !== picked.length) message.error("仅支持 PDF 文件");
    if (!onlyPdf.length) return;

    try {
      const init = await initUploads({
        files: onlyPdf.map((f) => ({ name: f.name, size: f.size }))
      });
      const uploadItems = init.uploadItems as { fileId: string; uploadToken: string }[];
      const next: typeof files = [];
      for (let i = 0; i < uploadItems.length; i++) {
        const item = uploadItems[i];
        const raw = onlyPdf[i];
        await uploadPdfPut(item.fileId, item.uploadToken, raw);
        next.push({
          id: item.fileId,
          name: raw.name,
          size: raw.size,
          progress: 100,
          status: "READY",
          uploadToken: item.uploadToken
        });
      }
      setFiles([...files, ...next]);
      message.success("文件已上传并就绪");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "上传失败";
      message.error(msg);
    }
  };

  const handleSubmit = async () => {
    try {
      setTask({
        taskStatus: "QUEUED",
        stageText: "正在排队...",
        taskId: undefined,
        errorCode: undefined,
        errorMessage: undefined,
        resultFileName: undefined
      });
      const data = await createTask({
        files: readyFiles.map((f, idx) => ({ fileId: f.id, orderIndex: idx + 1 }))
      });
      setTask({ taskId: data.taskId, taskStatus: "QUEUED", stageText: "正在合并文件..." });
    } catch (e: unknown) {
      const detail = parseMergeApiError(e);
      setTask({
        taskStatus: "FAILED",
        errorMessage: detail,
        errorCode: undefined,
        taskId: undefined,
        stageText: undefined
      });
      message.error(detail);
    }
  };

  const handleDownload = async () => {
    if (!task.taskId) return;
    const tokenData = await createDownloadToken(task.taskId);
    setTask({ downloadToken: tokenData.downloadToken });
    router.push(`/result/${task.taskId}`);
  };

  return (
    <AppShell activeKey="merge">
      <Space direction="vertical" size={16} style={{ width: "100%", maxWidth: 980 }}>
        <UploadDropzone onSelect={handleSelect} />
        <Card>
          {files.length === 0 ? (
            <Alert type="info" message="至少添加 2 个 PDF 文件后可开始合并" />
          ) : (
            <FileListSortable files={files} onReorder={setFiles} onDelete={removeFile} />
          )}
        </Card>

        {(task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING" || task.taskStatus === "SUCCEEDED" || task.taskStatus === "FAILED") && (
          <Card>
            <MergeProgress
              status={task.taskStatus as "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED"}
              stageText={task.stageText}
              errorDetail={
                task.taskStatus === "FAILED"
                  ? getErrorMessage(task.errorCode, task.errorMessage ?? "合并处理失败，请重试或更换文件")
                  : undefined
              }
            />
          </Card>
        )}

        {task.taskStatus === "SUCCEEDED" ? (
          <MergeResultPanel fileName={task.resultFileName} onDownload={handleDownload} onReset={reset} />
        ) : (
          <Button type="primary" size="large" disabled={!canSubmit} loading={task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING"} onClick={handleSubmit}>
            {task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING" ? "正在合并..." : "开始合并"}
          </Button>
        )}
      </Space>
    </AppShell>
  );
}
