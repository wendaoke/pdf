"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0891B2",
          colorSuccess: "#16A34A",
          colorError: "#DC2626",
          borderRadius: 12
        }
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConfigProvider>
  );
}
