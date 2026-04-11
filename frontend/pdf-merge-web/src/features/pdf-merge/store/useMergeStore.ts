"use client";

import { create } from "zustand";
import { MergeTaskViewModel, TaskStatus, UploadFileItem } from "../types/merge.types";

interface MergeState {
  files: UploadFileItem[];
  task: MergeTaskViewModel;
  setFiles: (files: UploadFileItem[]) => void;
  updateFile: (id: string, patch: Partial<UploadFileItem>) => void;
  removeFile: (id: string) => void;
  reorderFiles: (activeId: string, overId: string) => void;
  setTask: (task: Partial<MergeTaskViewModel>) => void;
  reset: () => void;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const initialTask: MergeTaskViewModel = { taskStatus: "IDLE" as TaskStatus };

/** Keys where `undefined` in a patch means "remove" so later polls do not wipe values with undefined. */
const TASK_PATCH_CLEAR_UNDEFINED = new Set<keyof MergeTaskViewModel>([
  "taskId",
  "errorCode",
  "errorMessage",
  "stageText",
  "resultFileName",
  "downloadToken",
  "mergeProgress"
]);

export const useMergeStore = create<MergeState>((set) => ({
  files: [],
  task: initialTask,
  setFiles: (files) => set({ files }),
  updateFile: (id, patch) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, ...patch } : f))
    })),
  removeFile: (id) => set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  reorderFiles: (activeId, overId) =>
    set((state) => {
      const from = state.files.findIndex((f) => f.id === activeId);
      const to = state.files.findIndex((f) => f.id === overId);
      if (from < 0 || to < 0 || from === to) return state;
      return { files: move(state.files, from, to) };
    }),
  setTask: (patch) =>
    set((state) => {
      const next = { ...state.task } as Record<string, unknown>;
      for (const [key, value] of Object.entries(patch) as [keyof MergeTaskViewModel, unknown][]) {
        if (value === undefined && TASK_PATCH_CLEAR_UNDEFINED.has(key)) {
          delete next[key as string];
          continue;
        }
        if (value !== undefined) {
          next[key as string] = value;
        }
      }
      return { task: next as unknown as MergeTaskViewModel };
    }),
  reset: () => set({ files: [], task: initialTask })
}));
