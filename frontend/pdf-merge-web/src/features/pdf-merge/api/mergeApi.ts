import axios, { isAxiosError } from "axios";

/** Next 对路径中的 `:` 解析不稳定；用 %3A 与 Spring 解码后仍映射到 uploads:init 等 */
const MERGE_UPLOADS_INIT = "/uploads%3Ainit";
const MERGE_UPLOADS_COMPLETE = "/uploads%3Acomplete";
const MERGE_UPLOADS_PUT = "uploads%3Aput";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge",
  timeout: 10000
});

/** 与后端 init / GET limits / 400 体中的 limits 字段一致 */
export type MergeLimitsPayload = {
  N_files?: number;
  S_single?: number;
  S_total?: number;
};

type ApiEnvelope = {
  code?: number;
  message?: string;
  data?: {
    error?: string;
    errorMessage?: string;
    errorCode?: string;
    limits?: unknown;
  };
};

function coerceLimitNum(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** 解析后端 limits 对象（兼容字符串数字、Jackson 键名变体） */
export function normalizeLimitsRecord(raw: unknown): MergeLimitsPayload | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const N_files =
    coerceLimitNum(o.N_files) ?? coerceLimitNum(o.n_files) ?? coerceLimitNum(o.nFiles);
  const S_single =
    coerceLimitNum(o.S_single) ?? coerceLimitNum(o.s_single) ?? coerceLimitNum(o.sSingleBytes);
  const S_total =
    coerceLimitNum(o.S_total) ?? coerceLimitNum(o.s_total) ?? coerceLimitNum(o.sTotalBytes);
  const out: MergeLimitsPayload = {};
  if (N_files !== undefined) out.N_files = N_files;
  if (S_single !== undefined) out.S_single = S_single;
  if (S_total !== undefined) out.S_total = S_total;
  return Object.keys(out).length ? out : undefined;
}

/** GET /limits：页面挂载时预取（数值以后端响应为准） */
export async function fetchMergeLimits(): Promise<MergeLimitsPayload | null> {
  try {
    const { data } = await http.get<{ code?: number; data?: unknown }>("/limits");
    const norm = normalizeLimitsRecord(data?.data);
    return norm ?? null;
  } catch {
    return null;
  }
}

/** 从合并接口 Axios 错误响应中读取 limits */
export function readMergeLimitsFromMergeApiError(e: unknown): MergeLimitsPayload | undefined {
  if (!isAxiosError(e)) return undefined;
  let body = e.response?.data as ApiEnvelope | undefined;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body) as ApiEnvelope;
    } catch {
      return undefined;
    }
  }
  const lim = body?.data?.limits;
  return normalizeLimitsRecord(lim);
}

/** Backend GlobalExceptionHandler returns HTTP 4xx/5xx with body { code, message, data: { error } }. */
export function parseMergeApiError(e: unknown): string {
  if (isAxiosError(e)) {
    let body = e.response?.data as ApiEnvelope | undefined;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body) as ApiEnvelope;
      } catch {
        /* ignore */
      }
    }
    const fromData = body?.data?.error ?? body?.data?.errorMessage;
    if (typeof fromData === "string" && fromData.trim()) {
      return fromData.trim();
    }
    if (typeof body?.message === "string" && body.message !== "success" && body.message.trim()) {
      return body.message.trim();
    }
    if (e.code === "ECONNABORTED") return "请求超时，请检查网络或稍后重试";
    if (e.message === "Network Error") return "无法连接服务，请确认接口地址与网络";
    if (e.response?.status) return `请求失败 HTTP ${e.response.status}`;
    return "请求失败，请重试";
  }
  if (e instanceof Error && e.message) return e.message;
  return "请求失败，请重试";
}

export interface InitUploadReq {
  files: { name: string; size: number }[];
}

export async function initUploads(payload: InitUploadReq) {
  const { data } = await http.post(MERGE_UPLOADS_INIT, payload);
  return data.data;
}

export async function completeUpload(payload: { fileId: string; uploadToken: string }) {
  const { data } = await http.post(MERGE_UPLOADS_COMPLETE, payload);
  return data.data;
}

/** Raw PDF body to path reserved at init; marks server-side session READY. */
export async function uploadPdfPut(fileId: string, uploadToken: string, file: File) {
  const base = (process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge").replace(/\/$/, "");
  const url = `${base}/${MERGE_UPLOADS_PUT}?fileId=${encodeURIComponent(fileId)}&uploadToken=${encodeURIComponent(uploadToken)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
    body: file
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `上传失败 HTTP ${res.status}`);
  }
  let json: { code?: number; message?: string; data?: unknown };
  try {
    json = JSON.parse(text) as { code?: number; message?: string; data?: unknown };
  } catch {
    throw new Error(text || "上传响应无效");
  }
  if (json.code !== 0 && json.code !== undefined) {
    throw new Error(json.message || "上传失败");
  }
  return json.data;
}

export async function createTask(payload: { files: { fileId: string; orderIndex: number }[] }) {
  const { data } = await http.post("/tasks", payload);
  return data.data;
}

/** Normalized task payload for polling (supports camelCase or snake_case JSON). */
export interface MergeTaskPollProgress {
  totalFiles: number;
  mergedFiles: number;
  currentOrderIndex?: number;
  currentFileName?: string;
}

export interface MergeTaskPollData {
  taskId?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  result?: { fileName?: string; sizeBytes?: number };
  progress?: MergeTaskPollProgress;
}

function pickStr(obj: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const a = obj[camel];
  const b = obj[snake];
  if (typeof a === "string" && a.length > 0) return a;
  if (typeof b === "string" && b.length > 0) return b;
  return undefined;
}

function pickErrField(obj: Record<string, unknown>, camel: string, snake: string): string | undefined {
  const v = obj[camel] ?? obj[snake];
  if (v == null) return undefined;
  const s = typeof v === "string" ? v.trim() : String(v).trim();
  return s.length > 0 ? s : undefined;
}

function pickInt(obj: Record<string, unknown>, camel: string, snake: string): number | undefined {
  const v = obj[camel] ?? obj[snake];
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return undefined;
}

function normalizeTaskProgress(raw: unknown): MergeTaskPollProgress | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const p = raw as Record<string, unknown>;
  const totalFiles = pickInt(p, "totalFiles", "total_files") ?? 0;
  const mergedFiles = pickInt(p, "mergedFiles", "merged_files") ?? 0;
  const currentOrderIndex = pickInt(p, "currentOrderIndex", "current_order_index");
  const currentFileName = pickStr(p, "currentFileName", "current_file_name");
  return {
    totalFiles,
    mergedFiles,
    currentOrderIndex,
    currentFileName
  };
}

function normalizeTaskPoll(raw: unknown): MergeTaskPollData {
  if (!raw || typeof raw !== "object") {
    return { status: "" };
  }
  const o = raw as Record<string, unknown>;
  const res = o.result;
  let result: MergeTaskPollData["result"];
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    const fileName = pickStr(r, "fileName", "file_name");
    if (fileName) {
      const sz = r.sizeBytes ?? r.size_bytes;
      result = {
        fileName,
        sizeBytes: typeof sz === "number" ? sz : undefined
      };
    }
  }
  const progress = normalizeTaskProgress(o.progress) ?? { totalFiles: 0, mergedFiles: 0 };
  return {
    taskId: pickStr(o, "taskId", "task_id"),
    status: typeof o.status === "string" ? o.status : "",
    errorCode: pickErrField(o, "errorCode", "error_code"),
    errorMessage: pickErrField(o, "errorMessage", "error_message"),
    result,
    progress
  };
}

export async function getTask(taskId: string): Promise<MergeTaskPollData> {
  const { data } = await http.get(`/tasks/${encodeURIComponent(taskId)}`);
  return normalizeTaskPoll(data.data);
}

export async function createDownloadToken(taskId: string) {
  const { data } = await http.post(`/tasks/${encodeURIComponent(taskId)}/download-token`);
  return data.data;
}

export function buildDownloadUrl(taskId: string, token: string) {
  const base = (http.defaults.baseURL || "").replace(/\/$/, "");
  return `${base}/tasks/${encodeURIComponent(taskId)}/download?token=${encodeURIComponent(token)}`;
}
