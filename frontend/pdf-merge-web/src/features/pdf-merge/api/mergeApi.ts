import axios from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge",
  timeout: 10000
});

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

export async function createTask(payload: { files: { fileId: string; orderIndex: number }[] }) {
  const { data } = await http.post("/tasks", payload);
  return data.data;
}

export async function getTask(taskId: string) {
  const { data } = await http.get(`/tasks/${taskId}`);
  return data.data;
}

export async function createDownloadToken(taskId: string) {
  const { data } = await http.post(`/tasks/${taskId}/download-token`);
  return data.data;
}

export function buildDownloadUrl(taskId: string, token: string) {
  return `${http.defaults.baseURL}/tasks/${taskId}/download?token=${encodeURIComponent(token)}`;
}
