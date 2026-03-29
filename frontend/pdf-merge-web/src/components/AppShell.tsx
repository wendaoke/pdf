"use client";

import Link from "next/link";
import { Layout, Menu } from "antd";
import type { ReactNode } from "react";

const { Header, Content, Footer } = Layout;

export function AppShell({ children, activeKey }: { children: ReactNode; activeKey: string }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#ffffff", borderBottom: "1px solid #e6f4f1" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" style={{ color: "#164e63", fontWeight: 700, fontSize: 18 }}>
            微锐
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[activeKey]}
            items={[
              { key: "home", label: <Link href="/">首页</Link> },
              { key: "merge", label: <Link href="/merge">PDF 合并</Link> },
              { key: "tools", label: <Link href="/tools">工具列表</Link> }
            ]}
            style={{ flex: 1, borderBottom: "none", minWidth: 320 }}
          />
        </div>
      </Header>
      <Content style={{ padding: "24px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: "center", color: "#4a7f8b" }}>
        PDF 工具集  · 微锐科技设计落地
      </Footer>
    </Layout>
  );
}
