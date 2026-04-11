package com.company.pdfmerge.worker.service;

@FunctionalInterface
public interface MergeProgressCallback {
    /**
     * @param mergeProgressDone sources fully merged into the destination so far
     * @param mergeProgressIndex order_index of the source currently being processed (null when none)
     * @param mergeProgressName display name for the current source (null when none)
     */
    void onProgress(int mergeProgressDone, Integer mergeProgressIndex, String mergeProgressName);
}
