"use client";

import { Button, Card, Space, Typography } from "antd";

export function MergeResultPanel({
  fileName,
  onDownload,
  onReset
}: {
  fileName?: string;
  onDownload: () => void;
  onReset: () => void;
}) {
  return (
    <Card>
      <Space direction="vertical">
        <Typography.Title level={4}>合并完成</Typography.Title>
        <Typography.Text>{fileName || "合并.pdf"}</Typography.Text>
        <Space>
          <Button type="primary" onClick={onDownload}>
            下载文件
          </Button>
          <Button onClick={onReset}>再合并一组</Button>
        </Space>
      </Space>
    </Card>
  );
}
