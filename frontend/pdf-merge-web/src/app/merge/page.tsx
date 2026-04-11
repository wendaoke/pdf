"use client";

import { Alert, App, Button, Card, Space } from "antd";
import {
  createDownloadToken,
  createTask,
  fetchMergeLimits,
  initUploads,
  parseMergeApiError,
  readMergeLimitsFromMergeApiError,
  uploadPdfPut
} from "@/features/pdf-merge/api/mergeApi";
import { FileListSortable } from "@/features/pdf-merge/components/FileListSortable";
import { MergeProgress } from "@/features/pdf-merge/components/MergeProgress";
import { MergeResultPanel } from "@/features/pdf-merge/components/MergeResultPanel";
import { UploadBatchProgress, uploadConcurrencyLimit } from "@/features/pdf-merge/components/UploadBatchProgress";
import { UploadDropzone } from "@/features/pdf-merge/components/UploadDropzone";
import { useMergePolling } from "@/features/pdf-merge/hooks/useMergePolling";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";
import type { MergeTaskViewModel, TaskStatus } from "@/features/pdf-merge/types/merge.types";
import { getErrorMessage } from "@/features/pdf-merge/utils/errorCodeMap";
import { runPool } from "@/features/pdf-merge/utils/uploadConcurrency";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";

export default function MergePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { files, setFiles, updateFile, removeFile, task, setTask, reset } = useMergeStore();
  const [prefetchedLimits, setPrefetchedLimits] = useState<Awaited<ReturnType<typeof fetchMergeLimits>>>(null);
  const [activeUploadIds, setActiveUploadIds] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMergeLimits().then((l) => {
      if (!cancelled) setPrefetchedLimits(l);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const readyFiles = files.filter((f) => f.status === "READY");
  const canSubmit =
    readyFiles.length >= 2 &&
    !files.some((f) => f.status === "UPLOADING" || f.status === "PENDING_UPLOAD");

  const polling = useMergePolling(task.taskId, task.taskStatus === "QUEUED" || task.taskStatus === "PROCESSING");

  useEffect(() => {
    if (!polling.isError || !task.taskId) return;
    if (task.taskStatus !== "QUEUED" && task.taskStatus !== "PROCESSING") return;
    const detail = parseMergeApiError(polling.error);
    setTask({
      taskStatus: "FAILED",
      errorMessage: detail,
      errorCode: undefined,
      stageText: undefined,
      mergeProgress: undefined
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
    if (d.status === "SUCCEEDED" || d.status === "FAILED") {
      patch.mergeProgress = undefined;
    }

    setTask(patch);
  }, [polling.data, polling.dataUpdatedAt, setTask, task.taskStatus, task.errorCode, task.errorMessage]);

  useEffect(() => {
    const d = polling.data;
    if (!d?.status) return;
    if (d.status !== "QUEUED" && d.status !== "PROCESSING") return;
    const p = d.progress;
    if (!p) return;
    setTask({
      mergeProgress: {
        totalFiles: p.totalFiles,
        mergedFiles: p.mergedFiles,
        currentOrderIndex: p.currentOrderIndex,
        currentFileName: p.currentFileName
      }
    });
  }, [polling.data, polling.dataUpdatedAt, setTask]);

  const handleSelect = async (picked: File[]) => {
    const onlyPdf = picked.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (onlyPdf.length !== picked.length) message.error("仅支持 PDF 文件");
    if (!onlyPdf.length) return;

    let limitsHint = prefetchedLimits;
    if (limitsHint?.N_files == null) {
      limitsHint = (await fetchMergeLimits()) ?? limitsHint;
    }

    try {
      const init = await initUploads({
        files: onlyPdf.map((f) => ({ name: f.name, size: f.size }))
      });
      const uploadItems = init.uploadItems as { fileId: string; uploadToken: string }[];
      const placeholders = uploadItems.map((item, i) => ({
        id: item.fileId,
        name: onlyPdf[i].name,
        size: onlyPdf[i].size,
        progress: 0,
        status: "PENDING_UPLOAD" as const,
        uploadToken: item.uploadToken
      }));
      const waveIds = uploadItems.map((u) => u.fileId);
      setActiveUploadIds(waveIds);
      setFiles([...files, ...placeholders]);

      try {
        await runPool(uploadItems, uploadConcurrencyLimit(), async (item, idx) => {
          const raw = onlyPdf[idx];
          updateFile(item.fileId, { status: "UPLOADING", progress: 0 });
          try {
            await uploadPdfPut(item.fileId, item.uploadToken, raw);
            updateFile(item.fileId, { status: "READY", progress: 100, errorMessage: undefined });
          } catch (e: unknown) {
            updateFile(item.fileId, {
              status: "FAILED",
              progress: 0,
              errorMessage: parseMergeApiError(e)
            });
          }
        });
      } finally {
        setActiveUploadIds(null);
      }

      const waveFailed = waveIds.filter((id) => useMergeStore.getState().files.find((f) => f.id === id)?.status === "FAILED").length;
      if (waveFailed === waveIds.length) {
        message.error("本批 PDF 全部上传失败，请检查网络或文件后重试");
      } else if (waveFailed > 0) {
        message.warning(`${waveFailed} 个文件上传失败，可从列表删除后重新添加`);
      } else {
        message.success("文件已上传并就绪");
      }
    } catch (e: unknown) {
      const detail = parseMergeApiError(e);
      const limits = readMergeLimitsFromMergeApiError(e);
      const maxFromErr = limits?.N_files;
      const maxFiles = maxFromErr ?? limitsHint?.N_files;
      const n = onlyPdf.length;
      const isFileCount =
        /文件数量超过上限|MERGE_400_TOO_MANY_FILES/i.test(detail) ||
        (detail.includes("文件数量") && detail.includes("上限"));
      const hasServerCounts =
        detail.includes("系统最多允许") && /本次\s*\d+\s*个/.test(detail);
      /** 仅当 400 响应体里带 limits 时，才与本次 init 为同一校验来源 */
      const limitsFromInitError = maxFromErr != null;

      let uploadHint: string;
      if (hasServerCounts) {
        uploadHint = detail;
      } else if (
        isFileCount &&
        typeof maxFiles === "number" &&
        !limitsFromInitError &&
        n <= maxFiles
      ) {
        uploadHint =
          `接口返回「${detail}」，但本次提交 ${n} 个 PDF 并未超过页面获知的上限（${maxFiles}）。` +
          `通常表示处理 uploads:init 的后端与 GET /limits 不是同一套配置（或其中一端未部署带 limits 的接口）。` +
          `请将 NEXT_PUBLIC_MERGE_API_BASE 指向实际校验的后端（如 http://127.0.0.1:8080/api/v1/pdf/merge），或把 MERGE_API_PROXY_TARGET / 环境变量与线网 pdfmerge.limits.n-files 对齐。`;
      } else if (isFileCount && typeof maxFiles === "number") {
        uploadHint = `文件数量超过上限：本次提交 ${n} 个 PDF，当前接口最多允许 ${maxFiles} 个。`;
      } else if (isFileCount) {
        uploadHint = `${detail}（本次提交 ${n} 个 PDF）`;
      } else {
        uploadHint = detail;
      }
      message.error(uploadHint, uploadHint.length > 48 ? 12 : 5);
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
        resultFileName: undefined,
        mergeProgress: undefined
      });
      const data = await createTask({
        files: readyFiles.map((f, idx) => ({ fileId: f.id, orderIndex: idx + 1 }))
      });
      setTask({ taskId: data.taskId, taskStatus: "QUEUED", stageText: "已提交任务，等待合并服务处理…" });
    } catch (e: unknown) {
      const detail = parseMergeApiError(e);
      setTask({
        taskStatus: "FAILED",
        errorMessage: detail,
        errorCode: undefined,
        taskId: undefined,
        stageText: undefined,
        mergeProgress: undefined
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
        <UploadBatchProgress files={files} activeUploadIds={activeUploadIds} />
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
              mergeProgress={task.mergeProgress}
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
