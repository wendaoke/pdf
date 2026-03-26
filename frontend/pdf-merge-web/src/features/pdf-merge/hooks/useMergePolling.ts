"use client";

import { useQuery } from "@tanstack/react-query";
import { getTask } from "../api/mergeApi";

export function useMergePolling(taskId?: string, enabled?: boolean) {
  return useQuery({
    queryKey: ["merge-task", taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId) && Boolean(enabled),
    refetchInterval: (query) => {
      const status = (query.state.data as { status?: string } | undefined)?.status;
      if (status === "SUCCEEDED" || status === "FAILED") return false;
      return 1500;
    }
  });
}
