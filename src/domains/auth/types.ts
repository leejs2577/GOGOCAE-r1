import { z } from 'zod';

// 사용자 역할 정의
export enum UserRole {
  DESIGNER = 'designer',
  ANALYST = 'analyst',
  ADMIN = 'admin',
}

// 로그인 폼 스키마
export const LoginFormSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

// 회원가입 폼 스키마
export const SignupFormSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  full_name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  confirmPassword: z.string(),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: '역할을 선택해주세요.' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

// 비밀번호 재설정 요청 스키마
export const ResetPasswordSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
});

// 비밀번호 재설정 폼 스키마
export const UpdatePasswordSchema = z.object({
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

// 프로필 수정 스키마
export const UpdateProfileSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요.'),
  full_name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
});

// 타입 추출
export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type SignupFormData = z.infer<typeof SignupFormSchema>;
export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;
export type UpdatePasswordData = z.infer<typeof UpdatePasswordSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// 인증 상태 인터페이스
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// API 응답 타입
export interface AuthResponse {
  user?: User;
  error?: string;
}

// 세션 타입
export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

