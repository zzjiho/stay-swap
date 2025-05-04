package com.stayswap.global.code;

import lombok.Getter;
import org.springframework.http.HttpStatusCode;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ErrorCode {

    TEST(INTERNAL_SERVER_ERROR, false, "T001", "business exception test"),

    /**
     * 400
     */
    INVALID_UPLOAD_FILE_EXTENSION(BAD_REQUEST, false , "BR001", "잘못된 파일 확장자입니다."),
    INVALID_FILE_COUNT_TOO_MANY(BAD_REQUEST, false , "BR002", "업로드 가능한 파일 개수를 초과했습니다."),

    NOT_EXISTS_USER(NOT_FOUND, false, "NF001", "존재하지 않는 회원입니다."),
    NOT_EXISTS_HOUSE(NOT_FOUND, false, "NF002", "존재하지 않는 숙소입니다."),
    NOT_EXISTS_SWAP_REQUEST(NOT_FOUND, false, "NF003", "존재하지 않는 교환/숙박 요청입니다."),

    CANNOT_SWAP_WITH_OWN_HOUSE(BAD_REQUEST, false, "BR003", "자신의 숙소와는 교환할 수 없습니다."),
    ALREADY_PROCESSED_REQUEST(BAD_REQUEST, false, "BR004", "이미 처리된 요청입니다."),

    /**
     * 403
     */
    NOT_AUTHORIZED(FORBIDDEN, false, "F001", "권한이 없습니다."),
    NOT_MY_HOUSE(FORBIDDEN, false, "F002", "자신의 숙소만 교환 가능합니다.");



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
