"use client";

import Link from "next/link";
import { Alert, Progress, Typography } from "antd";
import type { MergeTaskProgressView } from "../types/merge.types";

export function MergeProgress({
  stageText,
  status,
  errorDetail,
  mergeProgress
}: {
  stageText?: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  /** Shown when status is FAILED (e.g. backend errorCode / errorMessage). */
  errorDetail?: string;
  mergeProgress?: MergeTaskProgressView;
}) {
  if (status === "SUCCEEDED") {
    return <Alert type="success" message="合并成功，文件已就绪" showIcon />;
  }
  if (status === "FAILED") {
    return (
      <Alert type="error" role="alert" message={errorDetail || "合并失败，请重试或更换文件"} showIcon />
    );
  }

  const total = mergeProgress?.totalFiles ?? 0;
  const merged = mergeProgress?.mergedFiles ?? 0;
  const currentNameRaw = mergeProgress?.currentFileName?.trim();
  const currentOrder = mergeProgress?.currentOrderIndex;
  const currentName =
    currentNameRaw && currentNameRaw.length > 0
      ? currentNameRaw
      : currentOrder != null
        ? `第 ${currentOrder} 个`
        : "";
  const hasCurrent = currentName.length > 0;
  const waiting =
    total > 0 ? Math.max(0, total - merged - (status === "PROCESSING" && hasCurrent ? 1 : 0)) : undefined;

  let percent = status === "QUEUED" ? 12 : 55;
  if (total > 0 && status === "PROCESSING") {
    percent = Math.min(99, Math.round((merged / total) * 100));
  }

  const detailParts: string[] = [];
  if (total > 0) {
    detailParts.push(`共 ${total} 个文件`);
    detailParts.push(`已并入 ${merged} 个`);
    if (waiting !== undefined && status === "PROCESSING") {
      detailParts.push(`约 ${waiting} 个待处理`);
    }
    if (hasCurrent) {
      detailParts.push(`正在处理：${currentName}`);
    } else if (status === "PROCESSING" && merged === 0) {
      detailParts.push("正在读取首个 PDF（大文件可能需数十秒）…");
    }
  }

  return (
    <div>
      <Typography.Text>{stageText || "正在处理任务..."}</Typography.Text>
      {status === "QUEUED" && total > 0 && (
        <Typography.Paragraph type="warning" style={{ marginBottom: 8, marginTop: 4 }}>
          任务在队列中。若超过约 30 秒仍无「已并入」或「正在处理」变化，请到{" "}
          <Link href="/feedback">反馈问题</Link>
          ，我们会尽快处理。
        </Typography.Paragraph>
      )}
      {detailParts.length > 0 && (
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8, marginTop: 4 }}>
          {detailParts.join(" · ")}
        </Typography.Paragraph>
      )}
      <Progress
        percent={percent}
        status="active"
        strokeColor={{ "0%": "#0d9488", "100%": "#f97316" }}
        trailColor="#ccfbf1"
      />
    </div>
  );
}
