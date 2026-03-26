"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell activeKey="home">
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={16}>
          <Typography.Title style={{ margin: 0 }}>一站式 PDF 处理</Typography.Title>
          <Typography.Text>上传、排序、处理、下载，5 步完成任务闭环。</Typography.Text>
          <Space>
            <Link href="/merge">
              <Button type="primary">立即体验合并</Button>
            </Link>
            <Link href="/tools">
              <Button>查看工具列表</Button>
            </Link>
          </Space>
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="PDF 合并">按顺序拼接多个 PDF，输出单个结果文件。</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="PDF 压缩">降低体积，适合邮件传输与归档。</Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="PDF 拆分">按页拆分或批量提取目标区间。</Card>
        </Col>
      </Row>
    </AppShell>
  );
}
