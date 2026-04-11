package com.company.pdfmerge.worker.service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Service;

@Service
public class PdfMergeEngineService {

    public void merge(List<MergeSourceEntry> sources, String outputPath, MergeProgressCallback progress) throws IOException {
        if (sources == null || sources.isEmpty()) {
            throw new IllegalArgumentException("合并源列表不能为空");
        }
        MergeSourceEntry first = sources.get(0);
        progress.onProgress(0, first.orderIndex(), first.originFileName());
        try (PDDocument dest = Loader.loadPDF(new File(first.localPath()))) {
            boolean more = sources.size() > 1;
            progress.onProgress(
                    1,
                    more ? sources.get(1).orderIndex() : null,
                    more ? sources.get(1).originFileName() : null);
            PDFMergerUtility merger = new PDFMergerUtility();
            for (int i = 1; i < sources.size(); i++) {
                MergeSourceEntry ent = sources.get(i);
                try (PDDocument src = Loader.loadPDF(new File(ent.localPath()))) {
                    merger.appendDocument(dest, src);
                }
                boolean hasNext = i + 1 < sources.size();
                if (hasNext) {
                    MergeSourceEntry next = sources.get(i + 1);
                    progress.onProgress(i + 1, next.orderIndex(), next.originFileName());
                } else {
                    progress.onProgress(sources.size(), null, null);
                }
            }
            dest.save(new File(outputPath));
        }
    }
}
