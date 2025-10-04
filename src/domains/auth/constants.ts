// 인증 관련 상수 정의

// 사용자 역할 표시명
export const USER_ROLE_LABELS = {
  designer: '설계자',
  analyst: '해석자',
  admin: '관리자',
} as const;

// 인증 에러 메시지
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  EMAIL_NOT_CONFIRMED: '이메일 인증을 완료해주세요.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  WEAK_PASSWORD: '비밀번호가 너무 약합니다.',
  EMAIL_ALREADY_EXISTS: '이미 존재하는 이메일입니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

// 성공 메시지
export const AUTH_SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: '회원가입이 완료되었습니다.',
  LOGIN_SUCCESS: '로그인되었습니다.',
  LOGOUT_SUCCESS: '로그아웃되었습니다.',
  PASSWORD_RESET_SENT: '비밀번호 재설정 이메일을 발송했습니다.',
  PASSWORD_UPDATED: '비밀번호가 변경되었습니다.',
} as const;

// API 엔드포인트
export const AUTH_ENDPOINTS = {
  SIGNUP: '/api/auth/signup',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  RESET_PASSWORD: '/api/auth/reset-password',
  UPDATE_PASSWORD: '/api/auth/update-password',
  USER: '/api/auth/user',
} as const;

// 폼 필드 이름
export const FORM_FIELDS = {
  EMAIL: 'email',
  PASSWORD: 'password',
  CONFIRM_PASSWORD: 'confirmPassword',
  ROLE: 'role',
} as const;

// 리다이렉트 경로
export const REDIRECT_PATHS = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  RESET_PASSWORD: '/auth/reset-password',
} as const;

