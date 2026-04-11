package com.company.pdfmerge.api.controller;

import com.company.pdfmerge.api.model.ApiResponse;
import com.company.pdfmerge.api.service.FeedbackService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/feedback")
public class FeedbackController {
    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> submit(
            @RequestHeader(value = "X-Owner-Id", required = false) String ownerId,
            @RequestBody Map<String, Object> body) {
        return ApiResponse.success(feedbackService.submitFeedback(normalizeOwner(ownerId), body));
    }

    private static String normalizeOwner(String ownerId) {
        return (ownerId == null || ownerId.isBlank()) ? null : ownerId.trim();
    }
}
