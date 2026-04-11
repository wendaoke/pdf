import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade"
]);

function upstreamBase(): string {
  return (process.env.MERGE_API_PROXY_TARGET || "https://api.pdf.veryservice.com.cn").replace(/\/$/, "");
}

/** 从请求路径解析子路径，避免 Next 对 `:` 与 params 的处理导致 segments 为空、误打到上游根路径 */
function pathSegmentsFromRequest(req: NextRequest): string[] {
  const prefix = "/api/v1/pdf/merge";
  const pathname = req.nextUrl.pathname;
  if (!pathname.startsWith(prefix)) return [];
  let tail = pathname.slice(prefix.length);
  if (tail.startsWith("/")) tail = tail.slice(1);
  if (!tail) return [];
  return tail.split("/").map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

function buildUpstreamUrl(req: NextRequest, segments: string[]): URL {
  const tail = segments.length ? segments.join("/") : "";
  const pathname = tail ? `/api/v1/pdf/merge/${tail}` : "/api/v1/pdf/merge";
  return new URL(pathname + req.nextUrl.search, `${upstreamBase()}/`);
}

/**
 * 服务端 fetch 上游 API：不要转发浏览器 Origin/Referer，否则 Spring 按 CORS 校验会拒绝（如 Invalid CORS request）。
 * 也不要转发 access-control-request-*（预检头），避免误判。
 */
function copyRequestHeadersToUpstream(req: NextRequest, target: Headers): void {
  const allow = [
    "accept",
    "accept-language",
    "authorization",
    "content-type",
    "cookie",
    "user-agent",
    "x-requested-with"
  ];
  for (const name of allow) {
    const v = req.headers.get(name);
    if (v) target.set(name, v);
  }
}

function copyResponseHeaders(from: Headers, to: NextResponse): void {
  from.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    to.headers.set(key, value);
  });
}

async function proxy(req: NextRequest, segments: string[]): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = buildUpstreamUrl(req, segments);
  const headers = new Headers();
  copyRequestHeadersToUpstream(req, headers);

  const init: RequestInit & { duplex?: string } = {
    method: req.method,
    headers,
    redirect: "manual"
  };

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    init.body = req.body;
    init.duplex = "half";
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch {
    return NextResponse.json(
      { code: -1, message: "proxy upstream fetch failed", data: { error: "fetch threw" } },
      { status: 502 }
    );
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText
  });
  copyResponseHeaders(upstream.headers, res);
  return res;
}

export async function GET(req: NextRequest) {
  return proxy(req, pathSegmentsFromRequest(req));
}

export async function POST(req: NextRequest) {
  return proxy(req, pathSegmentsFromRequest(req));
}

export async function OPTIONS(req: NextRequest) {
  return proxy(req, pathSegmentsFromRequest(req));
}

export async function PUT(req: NextRequest) {
  return proxy(req, pathSegmentsFromRequest(req));
}
