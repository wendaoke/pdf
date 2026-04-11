"use client";

import { MenuOutlined } from "@ant-design/icons";
import Link from "next/link";
import { Button, Drawer, Grid, Layout, Menu } from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const { Header, Content, Footer } = Layout;

const NAV = [
  { key: "home", href: "/", label: "首页" },
  { key: "merge", href: "/merge", label: "PDF 合并" },
  { key: "tools", href: "/tools", label: "工具列表" },
  { key: "feedback", href: "/feedback", label: "意见反馈" }
] as const;

export function AppShell({ children, activeKey }: { children: ReactNode; activeKey: string }) {
  const screens = Grid.useBreakpoint();
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 首屏与 SSR 一致用桌面导航，避免 hydration 与断点不一致；挂载后再按屏宽切换
  const isMobile = mounted && !screens.md;

  const desktopMenuItems = useMemo(
    () =>
      NAV.map(({ key, href, label }) => ({
        key,
        label: <Link href={href}>{label}</Link>
      })),
    []
  );

  const mobileMenuItems = useMemo(
    () =>
      NAV.map(({ key, href, label }) => ({
        key,
        label: (
          <Link href={href} onClick={() => setDrawerOpen(false)}>
            {label}
          </Link>
        )
      })),
    []
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e6f4f1",
          paddingInline: 16,
          height: 56,
          lineHeight: "56px"
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            width: "100%",
            height: "100%"
          }}
        >
          <Link
            href="/"
            onClick={() => setDrawerOpen(false)}
            style={{
              color: "#164e63",
              fontWeight: 700,
              fontSize: 18,
              whiteSpace: "nowrap",
              flexShrink: 0,
              lineHeight: 1.2,
              display: "inline-flex",
              alignItems: "center"
            }}
          >
            微锐
          </Link>

          {isMobile ? (
            <>
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 20 }} />}
                aria-label="打开导航菜单"
                onClick={() => setDrawerOpen(true)}
                style={{ flexShrink: 0, width: 44, height: 44 }}
              />
              <Drawer
                title="导航"
                placement="right"
                width={280}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                styles={{ body: { paddingTop: 8 } }}
              >
                <Menu
                  mode="vertical"
                  selectedKeys={[activeKey]}
                  items={mobileMenuItems}
                  style={{ border: "none" }}
                />
              </Drawer>
            </>
          ) : (
            <Menu
              mode="horizontal"
              selectedKeys={[activeKey]}
              items={desktopMenuItems}
              disabledOverflow
              style={{
                flex: 1,
                minWidth: 0,
                borderBottom: "none",
                justifyContent: "flex-end",
                lineHeight: "56px"
              }}
            />
          )}
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
