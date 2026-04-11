"use client";

import Link from "next/link";
import { Button, Card, Col, Row, Space, Typography } from "antd";
import { AppShell } from "@/components/AppShell";

export default function ToolsPage() {
  return (
    <AppShell activeKey="tools">
      <div className="page-tools-band">
        <div className="page-tools-band__inner">
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0, color: "#164e63" }}>
                工具列表
              </Typography.Title>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8, maxWidth: 520 }}>
                与线网一致；压缩、拆分为「规划中」。
              </Typography.Paragraph>
            </div>
            <Row gutter={[16, 16]} justify="center">
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
        </div>
      </div>
    </AppShell>
  );
}
