import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
import { SignupFormSchema } from '@/domains/auth/types';
import { UserRole } from '@/domains/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 데이터 검증
    const validatedData = SignupFormSchema.parse(body);
    
    const supabase = await createServerSupabaseClient();

    // 사용자 생성 (Supabase Auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          role: validatedData.role,
          full_name: validatedData.full_name,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json(
        { error: { message: '회원가입 중 오류가 발생했습니다.' } },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: { message: '사용자 생성에 실패했습니다.' } },
        { status: 400 }
      );
    }

    // 성공 응답 (프로필은 트리거에 의해 자동 생성됨)
    return NextResponse.json(
      {
        data: {
          user: {
            id: authData.user.id,
            email: validatedData.email,
            role: validatedData.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API error:', error);
    
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
