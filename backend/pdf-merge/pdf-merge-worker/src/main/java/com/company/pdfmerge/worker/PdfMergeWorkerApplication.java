package com.company.pdfmerge.worker;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication(scanBasePackages = "com.company.pdfmerge")
@EnableConfigurationProperties(PdfMergeProperties.class)
public class PdfMergeWorkerApplication {
    public static void main(String[] args) {
        SpringApplication.run(PdfMergeWorkerApplication.class, args);
    }
}
