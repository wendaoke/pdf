import axios, { isAxiosError } from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge",
  timeout: 10000
});

type ApiEnvelope = {
  code?: number;
  message?: string;
  data?: { error?: string; errorMessage?: string; errorCode?: string };
};

/** Backend GlobalExceptionHandler returns HTTP 4xx/5xx with body { code, message, data: { error } }. */
export function parseMergeApiError(e: unknown): string {
  if (isAxiosError(e)) {
    const body = e.response?.data as ApiEnvelope | undefined;
    const fromData = body?.data?.error ?? body?.data?.errorMessage;
    if (typeof fromData === "string" && fromData.trim()) return fromData.trim();
    if (typeof body?.message === "string" && body.message !== "success" && body.message.trim()) {
      return body.message.trim();
    }
    if (e.code === "ECONNABORTED") return "请求超时，请检查网络或稍后重试";
    if (e.message === "Network Error") return "无法连接服务，请确认接口地址与网络";
    if (e.response?.status) return `请求失败 HTTP ${e.response.status}`;
  }
  if (e instanceof Error && e.message) return e.message;
  return "请求失败，请重试";
}

export interface InitUploadReq {
  files: { name: string; size: number }[];
}

export async function initUploads(payload: InitUploadReq) {
  const { data } = await http.post("/uploads:init", payload);
  return data.data;
}

export async function completeUpload(payload: { fileId: string; uploadToken: string }) {
  const { data } = await http.post("/uploads:complete", payload);
  return data.data;
}

/** Raw PDF body to path reserved at init; marks server-side session READY. */
export async function uploadPdfPut(fileId: string, uploadToken: string, file: File) {
  const base = process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge";
  const url = `${base}/uploads:put?fileId=${encodeURIComponent(fileId)}&uploadToken=${encodeURIComponent(uploadToken)}`;
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
export interface MergeTaskPollData {
  taskId?: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  result?: { fileName?: string; sizeBytes?: number };
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
  return {
    taskId: pickStr(o, "taskId", "task_id"),
    status: typeof o.status === "string" ? o.status : "",
    errorCode: pickErrField(o, "errorCode", "error_code"),
    errorMessage: pickErrField(o, "errorMessage", "error_message"),
    result
  };
}

export async function getTask(taskId: string): Promise<MergeTaskPollData> {
  const { data } = await http.get(`/tasks/${taskId}`);
  return normalizeTaskPoll(data.data);
}

export async function createDownloadToken(taskId: string) {
  const { data } = await http.post(`/tasks/${taskId}/download-token`);
  return data.data;
}

export function buildDownloadUrl(taskId: string, token: string) {
  return `${http.defaults.baseURL}/tasks/${taskId}/download?token=${encodeURIComponent(token)}`;
}
