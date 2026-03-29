"use client";

import { Alert, Progress, Typography } from "antd";

export function MergeProgress({
  stageText,
  status,
  errorDetail
}: {
  stageText?: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  /** Shown when status is FAILED (e.g. backend errorCode / errorMessage). */
  errorDetail?: string;
}) {
  if (status === "SUCCEEDED") {
    return <Alert type="success" message="合并成功，文件已就绪" showIcon />;
  }
  if (status === "FAILED") {
    return (
      <Alert type="error" role="alert" message={errorDetail || "合并失败，请重试或更换文件"} showIcon />
    );
  }
  return (
    <div>
      <Typography.Text>{stageText || "正在处理任务..."}</Typography.Text>
      <Progress percent={status === "QUEUED" ? 25 : 70} status="active" />
    </div>
  );
}
