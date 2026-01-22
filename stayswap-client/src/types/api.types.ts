// API 공통 응답 타입
export interface ApiResponse<T> {
  httpStatus: string;
  message: string;
  data: T;
  timestamp?: string;
}

// 에러 응답
export interface ApiErrorResponse {
  httpStatus: string;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

// 페이지네이션 메타데이터
export interface PageMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  number: number;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  content: T[];
  page: PageMeta;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
