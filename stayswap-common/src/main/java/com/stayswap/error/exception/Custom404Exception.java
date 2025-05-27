package com.stayswap.error.exception;

/**
 * 기존 404 not found 와 별개로
 * API 에서 강제로 404 를 반환하고 싶을 때 사용
 * */
public class Custom404Exception extends RuntimeException{

	private static final long serialVersionUID = 1L;

	public Custom404Exception() {
		super();
	}

	public Custom404Exception(String message) {
		super(message);
	}

	public Custom404Exception(String message, Throwable cause) {
		super(message, cause);
	}

	public Custom404Exception(Throwable cause) {
		super(cause);
	}

	protected Custom404Exception(String message, Throwable cause, boolean enableSuppression,
                                 boolean writableStackTrace) {
		super(message, cause, enableSuppression, writableStackTrace);

	}
}
