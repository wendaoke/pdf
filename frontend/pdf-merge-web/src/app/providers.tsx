"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App, ConfigProvider } from "antd";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0d9488",
          colorSuccess: "#059669",
          colorWarning: "#f59e0b",
          colorError: "#dc2626",
          colorInfo: "#14b8a6",
          colorText: "#164e63",
          colorTextSecondary: "#5b8a9e",
          colorTextTertiary: "#7a9bab",
          colorBorder: "#cfe8e4",
          colorBorderSecondary: "#e0f2f0",
          colorBgContainer: "#ffffff",
          colorBgLayout: "transparent",
          borderRadius: 8,
          fontFamily:
            'var(--font-inter), "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", system-ui, sans-serif',
          boxShadow: "0 2px 14px rgba(13, 148, 136, 0.06)",
          boxShadowSecondary: "0 1px 3px rgba(13, 148, 136, 0.08)"
        },
        components: {
          Layout: {
            headerBg: "transparent",
            bodyBg: "transparent",
            footerBg: "transparent",
            footerPadding: "20px 16px 28px"
          },
          Card: {
            borderRadiusLG: 8,
            paddingLG: 20
          },
          Menu: {
            horizontalItemSelectedColor: "#0d9488",
            itemColor: "#164e63",
            itemHoverColor: "#0d9488",
            activeBarHeight: 2,
            activeBarBorderWidth: 0
          },
          Typography: {
            colorTextDescription: "#5b8a9e"
          },
          Button: {
            defaultShadow: "none",
            primaryShadow: "0 2px 12px rgba(13, 148, 136, 0.28)"
          }
        }
      }}
    >
      <App>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </App>
    </ConfigProvider>
  );
}
