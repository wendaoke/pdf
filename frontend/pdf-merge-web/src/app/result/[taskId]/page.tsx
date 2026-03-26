"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Alert, Button, Card, Space, Typography } from "antd";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { buildDownloadUrl } from "@/features/pdf-merge/api/mergeApi";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";

export default function ResultPage() {
  const params = useParams<{ taskId: string }>();
  const { task, reset } = useMergeStore();
  const taskId = params.taskId;

  const downloadUrl = useMemo(() => {
    if (!task.downloadToken) return "";
    return buildDownloadUrl(taskId, task.downloadToken);
  }, [task.downloadToken, taskId]);

  return (
    <AppShell activeKey="merge">
      <Card>
        <Space direction="vertical" size={16}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            处理结果
          </Typography.Title>
          {task.taskStatus === "SUCCEEDED" ? (
            <Alert type="success" showIcon message="合并成功，结果文件已生成" />
          ) : (
            <Alert type="warning" showIcon message="任务可能未完成，请返回合并页查看实时状态" />
          )}
          <Typography.Text>任务 ID：{taskId}</Typography.Text>
          <Typography.Text>文件名：{task.resultFileName || "merged.pdf"}</Typography.Text>
          <Space>
            <Button type="primary" disabled={!downloadUrl} onClick={() => window.open(downloadUrl, "_blank")}>
              下载文件
            </Button>
            <Link href="/merge">
              <Button onClick={reset}>再合并一组</Button>
            </Link>
            <Link href="/tools">
              <Button>返回工具列表</Button>
            </Link>
          </Space>
        </Space>
      </Card>
    </AppShell>
  );
}
