package com.company.pdfmerge.worker.service;

/** One ordered PDF source for {@link PdfMergeEngineService}. */
public record MergeSourceEntry(String localPath, int orderIndex, String originFileName) {}
