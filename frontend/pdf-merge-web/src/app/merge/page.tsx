"use client";

import { Alert, Button, Card, Space, Typography, message } from "antd";
import { createDownloadToken, createTask, initUploads } from "@/features/pdf-merge/api/mergeApi";
import { FileListSortable } from "@/features/pdf-merge/components/FileListSortable";
import { MergeProgress } from "@/features/pdf-merge/components/MergeProgress";
import { MergeResultPanel } from "@/features/pdf-merge/components/MergeResultPanel";
import { UploadDropzone } from "@/features/pdf-merge/components/UploadDropzone";
import { useMergePolling } from "@/features/pdf-merge/hooks/useMergePolling";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";
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
    if (polling.data?.status && polling.data.status !== task.taskStatus) {
      setTask({
        taskStatus: polling.data.status,
        errorCode: polling.data.errorCode,
        errorMessage: polling.data.errorMessage,
        resultFileName: polling.data.result?.fileName
      });
    }
  }, [polling.data, setTask, task.taskStatus]);

  const handleSelect = async (picked: File[]) => {
    const onlyPdf = picked.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (onlyPdf.length !== picked.length) message.error("仅支持 PDF 文件");
    if (!onlyPdf.length) return;

    const init = await initUploads({
      files: onlyPdf.map((f) => ({ name: f.name, size: f.size }))
    });
    const next = init.uploadItems.map((item: { fileId: string; uploadToken: string }, i: number) => ({
      id: item.fileId,
      name: onlyPdf[i].name,
      size: onlyPdf[i].size,
      progress: 100,
      status: "READY" as const,
      uploadToken: item.uploadToken
    }));
    setFiles([...files, ...next]);
    message.success("文件已就绪");
  };

  const handleSubmit = async () => {
    try {
      setTask({ taskStatus: "QUEUED", stageText: "正在排队..." });
      const data = await createTask({
        files: readyFiles.map((f, idx) => ({ fileId: f.id, orderIndex: idx + 1 }))
      });
      setTask({ taskId: data.taskId, taskStatus: "QUEUED", stageText: "正在合并文件..." });
    } catch (e: unknown) {
      setTask({ taskStatus: "FAILED" });
      message.error("提交失败，请重试");
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
        <Typography.Title level={2}>PDF 合并</Typography.Title>
        <UploadDropzone onSelect={handleSelect} />
        <Card>
          {files.length === 0 ? (
            <Alert type="info" message="至少添加 2 个 PDF 文件后可开始合并" />
          ) : (
            <FileListSortable files={files} onReorder={setFiles} onDelete={removeFile} />
          )}
        </Card>

        {task.taskStatus === "FAILED" && (
          <Alert
            type="error"
            role="alert"
            message={getErrorMessage(task.errorCode, task.errorMessage || "合并失败，请重试")}
            showIcon
          />
        )}

        {(task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING" || task.taskStatus === "SUCCEEDED" || task.taskStatus === "FAILED") && (
          <Card>
            <MergeProgress
              status={task.taskStatus as "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED"}
              stageText={task.stageText}
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
