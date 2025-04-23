package com.stayswap.stayswap.global.model;

import com.stayswap.stayswap.global.code.ErrorCode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PRIVATE)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class RestApiResponse<T> {
    public static final RestApiResponse<String> OK = success("OK");

    private String httpStatus;

    private String message;

    private T data;

    public static <T> RestApiResponse<T> success(T data) {
        return new RestApiResponse<>("OK", "OK", data);
    }

    public static <T> RestApiResponse<T> error(ErrorCode errorCode) {
        return new RestApiResponse<>(errorCode.getCode(), errorCode.getMessage(), null);
    }

    public static <T> RestApiResponse<T> error(ErrorCode errorCode, String message) {
        return new RestApiResponse<>(errorCode.getCode(), message, null);
    }

    public static <T> RestApiResponse<T> of(String httpStatus, String message, T data) {
        return new RestApiResponse<>(httpStatus.toString(), message, data);
    }
}

