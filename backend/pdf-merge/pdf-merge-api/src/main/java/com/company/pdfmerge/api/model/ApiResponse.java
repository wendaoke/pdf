package com.company.pdfmerge.api.model;

public class ApiResponse<T> {
    private final int code;
    private final String message;
    private final T data;

    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "success", data);
    }

    public int getCode() { return code; }
    public String getMessage() { return message; }
    public T getData() { return data; }
}
