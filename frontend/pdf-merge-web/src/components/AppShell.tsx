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
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const headerClass = ["app-shell-header", headerScrolled ? "app-shell-header--scrolled" : ""].filter(Boolean).join(" ");

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        className={headerClass}
        style={{
          background: "#fffdfb",
          borderBottom: "1px solid rgba(13, 148, 136, 0.12)",
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
              color: "#0f766e",
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: "-0.02em",
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
                icon={<MenuOutlined style={{ fontSize: 20, color: "#164e63" }} />}
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
                lineHeight: "56px",
                background: "transparent"
              }}
            />
          )}
        </div>
      </Header>
      <Content style={{ padding: "24px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>{children}</div>
      </Content>
      <Footer style={{ textAlign: "center", color: "#5b8a9e", borderTop: "1px solid rgba(13, 148, 136, 0.12)" }}>
        PDF 工具集 · 微锐科技设计落地
      </Footer>
    </Layout>
  );
}
