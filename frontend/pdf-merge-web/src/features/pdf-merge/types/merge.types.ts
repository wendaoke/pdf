export type UploadStatus = "PENDING_UPLOAD" | "UPLOADING" | "READY" | "FAILED";
export type TaskStatus = "IDLE" | "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";

export interface UploadFileItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  uploadToken?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface MergeTaskViewModel {
  taskId?: string;
  taskStatus: TaskStatus;
  stageText?: string;
  errorCode?: string;
  errorMessage?: string;
  resultFileName?: string;
  downloadToken?: string;
}
