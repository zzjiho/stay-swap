package com.stayswap.global.code;

import lombok.Getter;
import org.springframework.http.HttpStatusCode;

import static org.springframework.http.HttpStatus.*;

@Getter
public enum ErrorCode {

    /**
     * 400
     */
    INVALID_UPLOAD_FILE_EXTENSION(BAD_REQUEST, false , "BR001", "잘못된 파일 확장자입니다."),
    INVALID_FILE_COUNT_TOO_MANY(BAD_REQUEST, false , "BR002", "업로드 가능한 파일 개수를 초과했습니다."),
    INVALID_USER_TYPE(BAD_REQUEST, false, "BR003", "잘못된 회원 타입입니다."),
    ALREADY_REGISTERED_USER(BAD_REQUEST, false, "BR004", "이미 가입된 회원입니다."),
    ALREADY_EXISTED_NICKNAME(BAD_REQUEST, false, "BR005", "이미 존재하는 닉네임입니다."),

    NOT_EXISTS_USER(NOT_FOUND, false, "NF001", "존재하지 않는 회원입니다."),
    NOT_EXISTS_HOUSE(NOT_FOUND, false, "NF002", "존재하지 않는 숙소입니다."),
    NOT_EXISTS_SWAP_REQUEST(NOT_FOUND, false, "NF003", "존재하지 않는 교환/숙박 요청입니다."),
    NOT_EXISTS_SWAP_HOUSE(NOT_FOUND, false, "NF004", "숙박 요청에는 상대방의 숙소에 리뷰를 작성할 수 없습니다."),

    CANNOT_SWAP_WITH_OWN_HOUSE(BAD_REQUEST, false, "BR006", "자신의 숙소와는 교환할 수 없습니다."),
    ALREADY_PROCESSED_REQUEST(BAD_REQUEST, false, "BR007", "이미 처리된 요청입니다."),
    CANNOT_CANCEL_OTHERS_REQUEST(FORBIDDEN, false, "BR008", "본인이 보낸 요청만 취소할 수 있습니다."),
    CANNOT_CANCEL_COMPLETED_REQUEST(BAD_REQUEST, false, "BR009", "완료된 요청은 취소할 수 없습니다."),
    ALREADY_REGISTED_REVIEW(BAD_REQUEST, false, "BR010", "이미 작성한 리뷰 입니다."),
    NOT_COMPLETED_SWAP(BAD_REQUEST, false, "BR011", "완료상태만 리뷰작성이 가능합니다."),
    CANNOT_REVIEW_OWN_HOUSE(BAD_REQUEST, false, "BR012", "자신의 숙소에는 리뷰를 작성할 수 없습니다."),

    NOT_EXISTS_RESOURCE(BAD_REQUEST, false, "BR013", "존재하지 않는 알림입니다."),


    /**
     * 인증 && 인가
     */
    TOKEN_EXPIRED(UNAUTHORIZED, false, "A001", "토큰이 만료되었습니다."),
    NOT_VALID_TOKEN(UNAUTHORIZED, false, "A002", "해당 토큰은 유효한 토큰이 아닙니다."),
    NOT_EXISTS_AUTHORIZATION(UNAUTHORIZED,false ,"A003" ,"Authorization Header가 빈값입니다." ),
    NOT_VALID_BEARER_GRANT_TYPE(UNAUTHORIZED,false ,"A004", "인증 타입이 Bearer 타입이 아닙니다." ),
    REFRESH_TOKEN_NOT_FOUND(UNAUTHORIZED, false, "A005", "해당 refresh token은 존재하지 않습니다."),
    NOT_ACCESS_TOKEN_TYPE(UNAUTHORIZED, false, "A007", "해당 토큰은 ACCESS TOKEN이 아닙니다."),

    /**
     * 403
     */
    NOT_AUTHORIZED(FORBIDDEN, false, "F001", "권한이 없습니다."),
    NOT_MY_HOUSE(FORBIDDEN, false, "F002", "자신의 숙소만 교환 가능합니다."),
    NOT_FOUND_REFRESH_TOKEN(FORBIDDEN, false, "F003", "리프레시 토큰을 찾을 수 없습니다."),
    REFRESH_TOKEN_EXPIRED(FORBIDDEN, false, "F004", "리프레시 토큰이 만료되었습니다."),
    NOT_MY_NICKNAME(FORBIDDEN, false, "F005", "자신의 닉네임만 수정할 수 있습니다."),
    NOT_MY_INTRODUCTION(FORBIDDEN, false, "F006", "자신의 소개만 수정할 수 있습니다.");


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
