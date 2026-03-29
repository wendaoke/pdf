"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import { AppShell } from "@/components/AppShell";

export default function ToolsPage() {
  return (
    <AppShell activeKey="tools">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title="PDF 合并">
              <Space direction="vertical">
                <Typography.Text>上传多个 PDF，排序后合并下载。</Typography.Text>
                <Link href="/merge">
                  <Button type="primary">进入</Button>
                </Link>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="PDF 压缩">
              <Typography.Text type="secondary">规划中</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="PDF 拆分">
              <Typography.Text type="secondary">规划中</Typography.Text>
            </Card>
          </Col>
        </Row>
      </Space>
    </AppShell>
  );
}
