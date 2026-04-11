"use client";

import { useQuery } from "@tanstack/react-query";
import { getTask, type MergeTaskPollData } from "../api/mergeApi";

export function useMergePolling(taskId?: string, enabled?: boolean) {
  return useQuery({
    queryKey: ["merge-task", taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId) && Boolean(enabled),
    /** 避免多次响应结构相近时复用同一引用，导致依赖 polling.data 的 effect 不触发、进度条卡住 */
    structuralSharing: false,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const status = (query.state.data as MergeTaskPollData | undefined)?.status;
      if (status === "SUCCEEDED" || status === "FAILED") return false;
      if (status === "PROCESSING") return 1000;
      return 1500;
    }
  });
}
