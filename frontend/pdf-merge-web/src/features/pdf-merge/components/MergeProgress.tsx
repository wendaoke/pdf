"use client";

import { Alert, Progress, Typography } from "antd";

export function MergeProgress({
  stageText,
  status
}: {
  stageText?: string;
  status: "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";
}) {
  if (status === "SUCCEEDED") {
    return <Alert type="success" message="合并成功，文件已就绪" showIcon />;
  }
  if (status === "FAILED") {
    return <Alert type="error" message="合并失败，请重试或更换文件" showIcon />;
  }
  return (
    <div>
      <Typography.Text>{stageText || "正在处理任务..."}</Typography.Text>
      <Progress percent={status === "QUEUED" ? 25 : 70} status="active" />
    </div>
  );
}
