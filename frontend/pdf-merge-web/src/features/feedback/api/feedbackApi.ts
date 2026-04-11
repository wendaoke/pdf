import axios, { isAxiosError } from "axios";
import { parseMergeApiError } from "@/features/pdf-merge/api/mergeApi";

/** Base for `/api/v1/*` routes (merge client uses `.../api/v1/pdf/merge`). */
export function apiV1RootBase(): string {
  const mergeBase = (process.env.NEXT_PUBLIC_MERGE_API_BASE || "http://localhost:8080/api/v1/pdf/merge").replace(/\/$/, "");
  return mergeBase.replace(/\/pdf\/merge$/i, "");
}

const feedbackHttp = axios.create({
  baseURL: apiV1RootBase(),
  timeout: 10000
});

export type FeedbackCategory = "merge" | "upload" | "other";

export interface SubmitFeedbackPayload {
  contact?: string;
  category?: FeedbackCategory;
  content: string;
  context?: {
    pagePath?: string;
    userAgent?: string;
    taskId?: string;
    clientVersion?: string;
  };
}

export async function submitFeedback(payload: SubmitFeedbackPayload, ownerId?: string): Promise<{ feedbackId: number }> {
  const headers: Record<string, string> = {};
  if (ownerId && ownerId.trim()) {
    headers["X-Owner-Id"] = ownerId.trim();
  }
  const { data } = await feedbackHttp.post("/feedback", payload, { headers });
  return data.data as { feedbackId: number };
}

export function parseFeedbackApiError(e: unknown): string {
  if (isAxiosError(e)) {
    return parseMergeApiError(e);
  }
  if (e instanceof Error && e.message) return e.message;
  return "提交失败，请重试";
}
