const map: Record<string, string> = {
  MERGE_400_PDF_INVALID: "仅支持 PDF 文件",
  MERGE_400_FILE_TOO_LARGE: "单文件超过上限",
  MERGE_400_TOO_MANY_FILES: "文件数量超过上限",
  MERGE_400_TOTAL_TOO_LARGE: "总大小超过上限",
  MERGE_400_ENCRYPTED_UNSUPPORTED: "暂不支持加密 PDF",
  MERGE_422_PDF_CORRUPTED: "文件损坏或不可读取",
  MERGE_503_ENGINE_FAILED: "合并失败，请稍后重试",
  MERGE_504_TIMEOUT: "处理超时，请稍后重试",
  MERGE_599_NETWORK: "网络异常，请检查连接后重试"
};

export function getErrorMessage(errorCode?: string, fallback?: string) {
  const fb = fallback?.trim() || "操作失败，请重试";
  if (!errorCode) return fb;
  const mapped = map[errorCode];
  if (mapped) return mapped;
  return fb;
}
