"use client";

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, List, Progress, Space, Tag, Typography } from "antd";
import { UploadFileItem } from "../types/merge.types";

function SortableRow({
  file,
  onDelete,
  onMove
}: {
  file: UploadFileItem;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <List.Item
      ref={setNodeRef}
      style={style}
      actions={[
        <Button key="up" icon={<ArrowUpOutlined />} onClick={() => onMove(file.id, -1)} />,
        <Button key="down" icon={<ArrowDownOutlined />} onClick={() => onMove(file.id, 1)} />,
        <Button key="delete" danger icon={<DeleteOutlined />} onClick={() => onDelete(file.id)} />
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Space>
          <Button type="text" icon={<HolderOutlined />} {...attributes} {...listeners} />
          <Typography.Text strong>{file.name}</Typography.Text>
          <Tag
            color={
              file.status === "READY" ? "success" : file.status === "FAILED" ? "error" : file.status === "PENDING_UPLOAD" ? "default" : "processing"
            }
          >
            {file.status}
          </Tag>
        </Space>
        {file.status === "UPLOADING" && <Progress percent={file.progress} size="small" />}
        {file.errorMessage && (
          <Typography.Text type="danger" role="alert">
            {file.errorMessage}
          </Typography.Text>
        )}
      </Space>
    </List.Item>
  );
}

export function FileListSortable({
  files,
  onReorder,
  onDelete
}: {
  files: UploadFileItem[];
  onReorder: (next: UploadFileItem[]) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const ids = files.map((f) => f.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(e) => {
        const activeId = e.active.id.toString();
        const overId = e.over?.id?.toString();
        if (!overId || activeId === overId) return;
        const oldIndex = files.findIndex((f) => f.id === activeId);
        const newIndex = files.findIndex((f) => f.id === overId);
        onReorder(arrayMove(files, oldIndex, newIndex));
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <List
          bordered
          rowKey="id"
          dataSource={files}
          renderItem={(file) => (
            <SortableRow
              file={file}
              onDelete={onDelete}
              onMove={(id, direction) => {
                const index = files.findIndex((f) => f.id === id);
                const next = index + direction;
                if (index < 0 || next < 0 || next >= files.length) return;
                onReorder(arrayMove(files, index, next));
              }}
            />
          )}
        />
      </SortableContext>
    </DndContext>
  );
}
