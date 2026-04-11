import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-inter"
});

/** 百度统计 hm.js 站点 id（来自 hm.baidu.com 后台） */
const BAIDU_HM_ID = "8f86357874a0bccb4370dbc0c402b22a";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>
        {process.env.NODE_ENV === "production" ? (
          <Script
            id="baidu-hm"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?${BAIDU_HM_ID}";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`
            }}
          />
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
