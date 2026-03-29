package com.company.pdfmerge.api;

import com.company.pdfmerge.common.config.PdfMergeProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(scanBasePackages = "com.company.pdfmerge")
@MapperScan("com.company.pdfmerge.common.mapper")
@EnableConfigurationProperties(PdfMergeProperties.class)
public class PdfMergeApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(PdfMergeApiApplication.class, args);
    }
}
