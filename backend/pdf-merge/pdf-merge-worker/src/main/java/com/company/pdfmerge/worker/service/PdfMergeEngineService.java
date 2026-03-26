package com.company.pdfmerge.worker.service;

import java.io.IOException;
import java.util.List;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Service;

@Service
public class PdfMergeEngineService {
    public void merge(List<String> inputPaths, String outputPath) throws IOException {
        PDFMergerUtility utility = new PDFMergerUtility();
        for (String path : inputPaths) {
            utility.addSource(path);
        }
        utility.setDestinationFileName(outputPath);
        utility.mergeDocuments(null);
    }
}
