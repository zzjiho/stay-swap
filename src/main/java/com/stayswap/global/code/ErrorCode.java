package com.stayswap.global.code;

import lombok.Getter;
import org.springframework.http.HttpStatusCode;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Getter
public enum ErrorCode {

    TEST(INTERNAL_SERVER_ERROR, false, "T001", "business exception test"),

    // 400
    INVALID_UPLOAD_FILE_EXTENSION(BAD_REQUEST, false , "BR001", "잘못된 파일 확장자입니다."),
    INVALID_FILE_COUNT_TOO_MANY(BAD_REQUEST, false , "BR002", "업로드 가능한 파일 개수를 초과했습니다.");


    private final HttpStatusCode statusCode;
    private final boolean notification;
    private final String code;
    private final String message;

    ErrorCode(HttpStatusCode statusCode, boolean notification, String code, String message) {
        this.statusCode = statusCode;
        this.notification = notification;
        this.code = code;
        this.message = message;
    }

}
