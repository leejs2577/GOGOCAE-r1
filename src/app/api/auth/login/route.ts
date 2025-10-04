import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
import { LoginFormSchema } from '@/domains/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 데이터 검증
    const validatedData = LoginFormSchema.parse(body);
    
    const supabase = await createServerSupabaseClient();

    // 사용자 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      console.error('Auth login error:', authError);
      
      // 구체적인 오류 메시지 제공
      let errorMessage = '로그인 중 오류가 발생했습니다.';
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = '이메일 인증을 완료해주세요.';
      }

      return NextResponse.json(
        { error: { message: errorMessage } },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: { message: '로그인에 실패했습니다.' } },
        { status: 400 }
      );
    }

    // 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: { message: '사용자 정보를 가져오는 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      {
        data: {
          user: {
            id: authData.user.id,
            email: profile.email,
            role: profile.role,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login API error:', error);
    
    // Zod 검증 오류
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { message: '입력 데이터가 올바르지 않습니다.' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
