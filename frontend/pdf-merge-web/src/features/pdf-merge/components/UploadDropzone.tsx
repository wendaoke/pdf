"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Upload, Typography } from "antd";
import type { RcFile } from "antd/es/upload";

const { Dragger } = Upload;

export function UploadDropzone({ onSelect }: { onSelect: (files: File[]) => void }) {
  return (
    <Dragger
      multiple
      accept=".pdf,application/pdf"
      showUploadList={false}
      beforeUpload={(file: RcFile) => {
        onSelect([file as unknown as File]);
        return false;
      }}
      onDrop={(e) => {
        onSelect(Array.from(e.dataTransfer.files));
      }}
      style={{ background: "#fff", borderRadius: 16 }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: "#0891B2" }} />
      </p>
      <Typography.Title level={4}>拖拽 PDF 到此处，或点击选择文件</Typography.Title>
      <Typography.Text type="secondary">至少添加 2 个 PDF 文件后可开始合并</Typography.Text>
    </Dragger>
  );
}
