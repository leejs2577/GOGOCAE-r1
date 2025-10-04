import { supabase } from '@/lib/supabase/client';
import { AUTH_ENDPOINTS } from '@/domains/auth/constants';
import type {
  LoginFormData,
  SignupFormData,
  ResetPasswordData,
  UpdatePasswordData,
  AuthResponse,
} from '@/domains/auth/types';

// 회원가입 서비스
export const signup = async (data: SignupFormData): Promise<AuthResponse> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.SIGNUP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error?.message || '회원가입 중 오류가 발생했습니다.' };
    }

    return { user: result.data.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

// 로그인 서비스
export const login = async (data: LoginFormData): Promise<AuthResponse> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error?.message || '로그인 중 오류가 발생했습니다.' };
    }

    return { user: result.data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

// 로그아웃 서비스
export const logout = async (): Promise<{ error?: string }> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const result = await response.json();
      return { error: result.error?.message || '로그아웃 중 오류가 발생했습니다.' };
    }

    return {};
  } catch (error) {
    console.error('Logout error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

// 비밀번호 재설정 요청 서비스
export const resetPassword = async (data: ResetPasswordData): Promise<{ error?: string }> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error?.message || '비밀번호 재설정 요청 중 오류가 발생했습니다.' };
    }

    return {};
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

// 비밀번호 업데이트 서비스
export const updatePassword = async (data: UpdatePasswordData): Promise<{ error?: string }> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.UPDATE_PASSWORD, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error?.message || '비밀번호 변경 중 오류가 발생했습니다.' };
    }

    return {};
  } catch (error) {
    console.error('Update password error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(AUTH_ENDPOINTS.USER, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error?.message || '사용자 정보를 가져오는 중 오류가 발생했습니다.' };
    }

    return { user: result.data.user };
  } catch (error) {
    console.error('Get current user error:', error);
    return { error: '네트워크 오류가 발생했습니다.' };
  }
};

