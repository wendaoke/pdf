"use client";

import { AppShell } from "@/components/AppShell";
import {
  parseFeedbackApiError,
  submitFeedback,
  type FeedbackCategory
} from "@/features/feedback/api/feedbackApi";
import { useMergeStore } from "@/features/pdf-merge/store/useMergeStore";
import { Alert, App, Button, Card, Form, Input, Select, Space, Typography } from "antd";
import { useState } from "react";

export default function FeedbackPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: { category?: FeedbackCategory; contact?: string; content: string }) => {
    setLoading(true);
    try {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 512) : "";
      const path = typeof window !== "undefined" ? window.location.pathname.slice(0, 512) : "";
      const taskId = useMergeStore.getState().task.taskId;
      await submitFeedback({
        content: values.content,
        category: values.category,
        contact: values.contact?.trim() || undefined,
        context: {
          pagePath: path || undefined,
          userAgent: ua || undefined,
          clientVersion: "pdf-merge-web",
          ...(taskId ? { taskId } : {})
        }
      });
      message.success("已提交，感谢反馈。我们会尽快查看。");
      form.resetFields();
    } catch (e: unknown) {
      message.error(parseFeedbackApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell activeKey="feedback">
      <Space direction="vertical" size={16} style={{ width: "100%", maxWidth: 720 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          意见反馈
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          遇到问题请尽量描述操作步骤、现象与期望结果。可选填联系方式便于我们回复（仅用于沟通本次反馈，不做营销用途）。
        </Typography.Paragraph>
        <Alert
          type="info"
          showIcon
          message="我们不会收集上传令牌、完整文件路径等敏感信息；仅保存您填写的内容与页面等基础上下文。"
        />
        <Card>
          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
            <Form.Item name="category" label="问题类型">
              <Select
                allowClear
                placeholder="请选择（可选）"
                options={[
                  { value: "merge", label: "PDF 合并" },
                  { value: "upload", label: "上传 / 文件列表" },
                  { value: "other", label: "其他" }
                ]}
              />
            </Form.Item>
            <Form.Item name="contact" label="联系方式（选填）">
              <Input maxLength={128} placeholder="邮箱、手机或昵称" allowClear />
            </Form.Item>
            <Form.Item
              name="content"
              label="问题描述"
              rules={[{ required: true, message: "请填写问题描述" }, { max: 2000, message: "最多 2000 字" }]}
            >
              <Input.TextArea rows={8} placeholder="请描述遇到的问题…" showCount maxLength={2000} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                提交反馈
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </AppShell>
  );
}
