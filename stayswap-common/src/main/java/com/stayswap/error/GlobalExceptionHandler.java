package com.stayswap.error;


import com.stayswap.error.exception.BusinessException;
import com.stayswap.error.exception.CustomRunTimeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * javax.validation.Valid 또는 @Validated binding error가 발생할 경우
     */
    @ExceptionHandler(BindException.class)
    protected ResponseEntity<ErrorResponse> handleBindException(BindException e) {
        log.error("handleBindException", e);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST.toString(), e.getBindingResult());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * 주로 @RequestParam enum으로 binding 못했을 경우 발생
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    protected ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.error("handleMethodArgumentTypeMismatchException", e);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.BAD_REQUEST.toString(), e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }

    /**
     * 지원하지 않은 HTTP method 호출 할 경우 발생
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    protected ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        log.error("handleHttpRequestMethodNotSupportedException", e);
        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.METHOD_NOT_ALLOWED.toString(), e.getMessage());
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(errorResponse);
    }

    /**
     * 비즈니스 로직 실행 중 오류 발생
     */
    @ExceptionHandler(value = { BusinessException.class })
    protected ResponseEntity<ErrorResponse> handleConflict(BusinessException e) {
        log.error("BusinessException", e);
        ErrorResponse errorResponse = ErrorResponse.of(e.getErrorCode().getCode(), e.getMessage());
        return ResponseEntity.status(e.getErrorCode().getStatusCode())
                .body(errorResponse);
    }

    /**
     * 나머지 예외 발생
     */
//    @ExceptionHandler(Exception.class)
//    protected ResponseEntity<ErrorResponse> handleException(Exception e) {
//        log.error("Exception", e);
//        ErrorResponse errorResponse = ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.toString(), e.getMessage());
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
//    }

    /**
     * custom 예외 발생시
     */
    @ExceptionHandler(CustomRunTimeException.class)
    protected ResponseEntity<ErrorResponse> handleNotFoundException(CustomRunTimeException e) {
        log.error("CustomRunTimeException", e);
        ErrorResponse errorResponse = ErrorResponse.of(e.getErrorCode().toString(), e.getMessage());
        return ResponseEntity.status(e.getErrorCode().getStatusCode()).body(errorResponse);
    }

}