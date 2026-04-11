"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Upload, Typography } from "antd";
import type { RcFile } from "antd/es/upload";
import { useCallback, useEffect, useRef } from "react";

const { Dragger } = Upload;

function rcListToFiles(list: RcFile[]): File[] {
  const out: File[] = [];
  for (const f of list) {
    const raw = (f as unknown as { originFileObj?: File }).originFileObj;
    if (raw instanceof File) out.push(raw);
    else if (f instanceof File) out.push(f as File);
  }
  return out;
}

export function UploadDropzone({ onSelect }: { onSelect: (files: File[]) => void }) {
  const latestListRef = useRef<RcFile[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current != null) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      const files = rcListToFiles(latestListRef.current);
      if (files.length) onSelect(files);
    }, 0);
  }, [onSelect]);

  useEffect(
    () => () => {
      if (flushTimerRef.current != null) clearTimeout(flushTimerRef.current);
    },
    []
  );

  return (
    <Dragger
      multiple
      accept=".pdf,application/pdf"
      showUploadList={false}
      beforeUpload={(_file: RcFile, fileList: RcFile[]) => {
        // antd 会对每个文件调一次 beforeUpload，且 fileList 逐步变长；若只在「最后一个 uid」里触发，
        // 仍可能在内部列表累积后单次传入 > n-files。用 microtask 合并为一次 onSelect，只保留最终列表。
        latestListRef.current = fileList ?? [];
        scheduleFlush();
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
