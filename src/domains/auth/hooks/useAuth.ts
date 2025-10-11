'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  signup,
  login,
  logout,
  resetPassword,
  updatePassword,
  getCurrentUser,
} from '@/domains/auth/services/authService';
import type {
  AuthState,
  LoginFormData,
  SignupFormData,
  ResetPasswordData,
  UpdatePasswordData,
  User,
} from '@/domains/auth/types';
import { AUTH_SUCCESS_MESSAGES } from '@/domains/auth/constants';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  const router = useRouter();
  const { toast } = useToast();

  // 사용자 상태 업데이트
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  // 초기 사용자 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        updateAuthState({ isLoading: true, error: null });
        
        // Supabase 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Auth: Session found, getting user info');
          // 사용자 정보 가져오기
          const result = await getCurrentUser();
          console.log('Auth: getCurrentUser result:', result);
          if (result.user) {
            updateAuthState({ user: result.user, isLoading: false });
          } else {
            console.log('Auth: getCurrentUser failed:', result.error);
            updateAuthState({ user: null, isLoading: false, error: result.error || null });
          }
        } else {
          console.log('Auth: No session found');
          updateAuthState({ user: null, isLoading: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        updateAuthState({ user: null, isLoading: false, error: '인증 초기화 중 오류가 발생했습니다.' });
      }
    };

    initializeAuth();

    // Supabase 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session?.user) {
        const result = await getCurrentUser();
        if (result.user) {
          updateAuthState({ user: result.user, isLoading: false, error: null });
        }
      } else if (event === 'SIGNED_OUT') {
        updateAuthState({ user: null, isLoading: false, error: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [updateAuthState]);

  // 회원가입
  const handleSignup = useCallback(async (data: SignupFormData) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const result = await signup(data);
      
      if (result.error) {
        updateAuthState({ isLoading: false, error: result.error });
        toast({
          title: '회원가입 실패',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      updateAuthState({ isLoading: false });
      toast({
        title: '회원가입 성공',
        description: AUTH_SUCCESS_MESSAGES.SIGNUP_SUCCESS,
      });
      
      // 회원가입 성공 후 로그인 페이지로 리다이렉트
      router.push('/auth/login');
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      updateAuthState({ isLoading: false, error: '회원가입 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState, toast, router]);

  // 로그인
  const handleLogin = useCallback(async (data: LoginFormData) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const result = await login(data);
      
      if (result.error) {
        updateAuthState({ isLoading: false, error: result.error });
        toast({
          title: '로그인 실패',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      updateAuthState({ user: result.user || null, isLoading: false });
      toast({
        title: '로그인 성공',
        description: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS,
      });
      
      // 로그인 성공 후 대시보드로 리다이렉트
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      updateAuthState({ isLoading: false, error: '로그인 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState, toast, router]);

  // 로그아웃
  const handleLogout = useCallback(async () => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const result = await logout();
      
      if (result.error) {
        updateAuthState({ isLoading: false, error: result.error });
        toast({
          title: '로그아웃 실패',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      updateAuthState({ user: null, isLoading: false });
      toast({
        title: '로그아웃 성공',
        description: AUTH_SUCCESS_MESSAGES.LOGOUT_SUCCESS,
      });
      
      // 로그아웃 후 홈페이지로 리다이렉트
      router.push('/');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      updateAuthState({ isLoading: false, error: '로그아웃 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState, toast, router]);

  // 비밀번호 재설정 요청
  const handleResetPassword = useCallback(async (data: ResetPasswordData) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const result = await resetPassword(data);
      
      if (result.error) {
        updateAuthState({ isLoading: false, error: result.error });
        toast({
          title: '비밀번호 재설정 실패',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      updateAuthState({ isLoading: false });
      toast({
        title: '이메일 발송 완료',
        description: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET_SENT,
      });
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      updateAuthState({ isLoading: false, error: '비밀번호 재설정 요청 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState, toast]);

  // 비밀번호 업데이트
  const handleUpdatePassword = useCallback(async (data: UpdatePasswordData) => {
    try {
      updateAuthState({ isLoading: true, error: null });

      const result = await updatePassword(data);

      if (result.error) {
        updateAuthState({ isLoading: false, error: result.error });
        toast({
          title: '비밀번호 변경 실패',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      updateAuthState({ isLoading: false });
      toast({
        title: '비밀번호 변경 성공',
        description: AUTH_SUCCESS_MESSAGES.PASSWORD_UPDATED,
      });
      return true;
    } catch (error) {
      console.error('Update password error:', error);
      updateAuthState({ isLoading: false, error: '비밀번호 변경 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState, toast]);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    try {
      console.log('Refreshing user data...');
      updateAuthState({ isLoading: true, error: null });

      const result = await getCurrentUser();
      console.log('Refresh user result:', result);

      if (result.user) {
        updateAuthState({ user: result.user, isLoading: false });
        return true;
      } else {
        updateAuthState({ isLoading: false, error: result.error || null });
        return false;
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      updateAuthState({ isLoading: false, error: '사용자 정보 새로고침 중 오류가 발생했습니다.' });
      return false;
    }
  }, [updateAuthState]);

  return {
    ...authState,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    refreshUser,
  };
};
