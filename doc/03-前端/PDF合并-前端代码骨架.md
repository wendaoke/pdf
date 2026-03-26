# PDF 合并 MVP 前端代码骨架（Next.js 14）

## 1. 类型定义 `types/merge.types.ts`

```ts
export type FileStatus = "PENDING_UPLOAD" | "UPLOADING" | "READY" | "FAILED";
export type TaskStatus = "IDLE" | "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";

export interface MergeFileItem {
  fileId: string;
  name: string;
  size: number;
  status: FileStatus;
  uploadToken?: string;
  localFileName?: string;
  progress?: number;
  errorCode?: string;
}

export interface MergeTaskDetail {
  taskId: string;
  status: TaskStatus;
  progress?: { stage?: string; current?: number; total?: number };
  errorCode?: string | null;
  errorMessage?: string | null;
  result?: { fileName: string; sizeBytes: number } | null;
}
```

## 2. Store `store/useMergeStore.ts`

```ts
import { create } from "zustand";
import type { MergeFileItem, TaskStatus, MergeTaskDetail } from "../types/merge.types";

interface MergeState {
  files: MergeFileItem[];
  taskId?: string;
  taskStatus: TaskStatus;
  taskDetail?: MergeTaskDetail;
  setFiles: (files: MergeFileItem[]) => void;
  updateFile: (fileId: string, patch: Partial<MergeFileItem>) => void;
  setTask: (taskId: string, status: TaskStatus) => void;
  setTaskDetail: (detail: MergeTaskDetail) => void;
  reset: () => void;
}

export const useMergeStore = create<MergeState>((set) => ({
  files: [],
  taskStatus: "IDLE",
  setFiles: (files) => set({ files }),
  updateFile: (fileId, patch) =>
    set((s) => ({ files: s.files.map((f) => (f.fileId === fileId ? { ...f, ...patch } : f)) })),
  setTask: (taskId, status) => set({ taskId, taskStatus: status }),
  setTaskDetail: (detail) => set({ taskDetail: detail, taskStatus: detail.status }),
  reset: () => set({ files: [], taskId: undefined, taskStatus: "IDLE", taskDetail: undefined }),
}));
```

## 3. API 封装 `api/mergeApi.ts`

```ts
import axios from "axios";

const http = axios.create({
  baseURL: "/接口/v1/pdf/merge",
  timeout: 15000,
});

export const mergeApi = {
  uploadsInit: (payload: { files: Array<{ name: string; size: number }> }) =>
    http.post("/uploads:init", payload),
  uploadsComplete: (payload: { fileId: string; uploadToken: string }) =>
    http.post("/uploads:complete", payload),
  createTask: (payload: { files: Array<{ fileId: string; orderIndex: number }> }, idempotencyKey: string) =>
    http.post("/tasks", payload, { headers: { "Idempotency-Key": idempotencyKey } }),
  getTask: (taskId: string) => http.get(`/tasks/${taskId}`),
  getDownloadToken: (taskId: string) => http.post(`/tasks/${taskId}/download-token`),
  downloadFile: (taskId: string, token: string) =>
    http.get(`/tasks/${taskId}/download`, { params: { token }, responseType: "blob" }),
};
```

## 4. 轮询 Hook `hooks/useMergePolling.ts`

```ts
import { useEffect } from "react";
import { mergeApi } from "../接口/mergeApi";
import { useMergeStore } from "../store/useMergeStore";

const FINAL_STATUS = new Set(["SUCCEEDED", "FAILED"]);

export function useMergePolling(taskId?: string) {
  const setTaskDetail = useMergeStore((s) => s.setTaskDetail);

  useEffect(() => {
    if (!taskId) return;
    let timer: number | undefined;
    let interval = 1500;
    const startedAt = Date.now();

    const tick = async () => {
      const res = await mergeApi.getTask(taskId);
      const detail = res.data.data;
      setTaskDetail(detail);

      if (FINAL_STATUS.has(detail.status)) return;
      if (Date.now() - startedAt > 120000) return;

      interval = Math.min(interval + 500, 5000);
      timer = window.setTimeout(tick, interval);
    };

    timer = window.setTimeout(tick, interval);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [taskId, setTaskDetail]);
}
```

## 5. 错误映射 `utils/errorCodeMap.ts`

```ts
const errorCodeMap: Record<string, string> = {
  MERGE_400_PDF_INVALID: "仅支持 PDF 文件",
  MERGE_400_FILE_TOO_LARGE: "单文件超过上限",
  MERGE_400_TOO_MANY_FILES: "文件数量超过上限",
  MERGE_400_TOTAL_TOO_LARGE: "总大小超过上限",
  MERGE_400_ENCRYPTED_UNSUPPORTED: "暂不支持加密 PDF",
  MERGE_422_PDF_CORRUPTED: "文件损坏或不可读取",
  MERGE_503_ENGINE_FAILED: "合并失败，请稍后重试",
  MERGE_504_TIMEOUT: "处理超时，请稍后重试",
  MERGE_599_NETWORK: "网络异常，请检查连接后重试",
};

export function getErrorMessage(code?: string) {
  if (!code) return "操作失败，请稍后重试";
  return errorCodeMap[code] ?? "操作失败，请稍后重试";
}
```

## 6. 埋点封装 `utils/analytics.ts`

```ts
export function track(event: string, payload: Record<string, unknown> = {}) {
  // TODO: 替换为真实埋点 SDK
  // eslint-disable-next-line no-console
  console.log("[track]", event, payload);
}
```

## 7. 页面骨架 `app/merge/page.tsx`

```tsx
"use client";

import { Button, message } from "antd";
import { useMemo } from "react";
import { mergeApi } from "@/features/pdf-merge/接口/mergeApi";
import { useMergePolling } from "@/features/pdf-merge/hooks/useMergePolling";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";
import { getErrorMessage } from "@/features/pdf-merge/utils/errorCodeMap";
import { track } from "@/features/pdf-merge/utils/analytics";

export default function MergePage() {
  const { files, taskId, taskStatus, setTask } = useMergeStore();
  useMergePolling(taskId);

  const canSubmit = useMemo(() => {
    const readyCount = files.filter((f) => f.status === "READY").length;
    const hasUploading = files.some((f) => f.status === "UPLOADING");
    return readyCount >= 2 && !hasUploading;
  }, [files]);

  const onSubmit = async () => {
    try {
      track("merge_submit");
      const payload = {
        files: files
          .filter((f) => f.status === "READY")
          .map((f, i) => ({ fileId: f.fileId, orderIndex: i + 1 })),
      };
      const res = await mergeApi.createTask(payload, crypto.randomUUID());
      setTask(res.data.data.taskId, res.data.data.status);
    } catch (e: any) {
      message.error(getErrorMessage(e?.response?.data?.code));
    }
  };

  return (
    <main>
      <h1>PDF 合并</h1>
      {/* TODO: 接入 UploadDropzone / FileListSortable / MergeProgress / MergeResultPanel */}
      <Button type="primary" disabled={!canSubmit || taskStatus === "PROCESSING"} onClick={onSubmit}>
        开始合并
      </Button>
    </main>
  );
}
```
