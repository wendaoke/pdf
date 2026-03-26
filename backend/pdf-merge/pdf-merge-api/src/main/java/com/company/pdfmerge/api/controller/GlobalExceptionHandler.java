package com.company.pdfmerge.api.controller;

import com.company.pdfmerge.api.model.ApiResponse;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleIllegal(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.success(Map.of("error", ex.getMessage())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleOther(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.success(Map.of("error", ex.getMessage())));
    }
}
