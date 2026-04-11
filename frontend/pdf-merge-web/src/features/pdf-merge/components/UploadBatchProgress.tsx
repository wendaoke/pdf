"use client";

import { Alert, Typography } from "antd";
import type { UploadFileItem } from "../types/merge.types";

const UPLOAD_CONCURRENCY = 6;

export function uploadConcurrencyLimit() {
  return UPLOAD_CONCURRENCY;
}

function orderedSubset(files: UploadFileItem[], ids: string[]) {
  const set = new Set(ids);
  return ids.map((id) => files.find((f) => f.id === id)).filter((f): f is UploadFileItem => Boolean(f));
}

/** Stats for the current upload wave (`activeIds` from init). */
export function uploadWaveStats(files: UploadFileItem[], activeIds: string[] | null) {
  if (!activeIds?.length) return null;
  const subset = orderedSubset(files, activeIds);
  if (subset.length === 0) return null;
  const anyPending = subset.some((f) => f.status === "PENDING_UPLOAD" || f.status === "UPLOADING");
  if (!anyPending && subset.every((f) => f.status === "READY" || f.status === "FAILED")) {
    return null;
  }
  const total = subset.length;
  const ready = subset.filter((f) => f.status === "READY").length;
  const uploading = subset.filter((f) => f.status === "UPLOADING").length;
  const pending = subset.filter((f) => f.status === "PENDING_UPLOAD").length;
  const failed = subset.filter((f) => f.status === "FAILED").length;
  const current =
    subset.find((f) => f.status === "UPLOADING")?.name ?? (pending > 0 ? "等待上传槽位…" : undefined);
  return { total, ready, uploading, pending, failed, current };
}

export function UploadBatchProgress({ files, activeUploadIds }: { files: UploadFileItem[]; activeUploadIds: string[] | null }) {
  const stats = uploadWaveStats(files, activeUploadIds);
  if (!stats) return null;
  const { total, ready, uploading, pending, failed, current } = stats;
  return (
    <Alert
      type="info"
      showIcon
      message={
        <Typography.Text>
          上传进度：共 {total} 个 · 已就绪 {ready} · 等待槽位 {pending} · 传输中 {uploading}
          {failed > 0 ? ` · 失败 ${failed}` : ""}
          {current ? ` · 当前：${current}` : ""}
        </Typography.Text>
      }
    />
  );
}
