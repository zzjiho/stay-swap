import { z } from 'zod';

// Validation Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 8자 이상이어야 합니다'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해주세요')
      .email('올바른 이메일 형식이 아닙니다'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        '대문자, 소문자, 숫자, 특수문자를 포함해야 합니다'
      ),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
    name: z
      .string()
      .min(2, '이름은 2자 이상이어야 합니다')
      .max(50, '이름은 50자 이하여야 합니다'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

// Request Types (Zod에서 추론)
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Response Types (백엔드 UserInfoResponse와 일치)
export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  profile?: string;
  introduction?: string;
  userType?: 'KAKAO' | 'NAVER' | 'GOOGLE' | 'LOCAL';
  joinYear?: number;
  reviewCount?: number;
}

export interface LoginResponse {
  user: User;
  // HttpOnly 쿠키 사용으로 accessToken은 응답에 포함되지 않음
}

export interface RegisterResponse {
  user: User;
}
