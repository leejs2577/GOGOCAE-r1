import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ResetPasswordSchema } from '@/domains/auth/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 입력 데이터 검증
    const validatedData = ResetPasswordSchema.parse(body);
    
    const supabase = await createServerSupabaseClient();

    // 비밀번호 재설정 이메일 발송
    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/update-password`,
    });

    if (error) {
      console.error('Reset password error:', error);
      return NextResponse.json(
        { error: { message: '비밀번호 재설정 요청 중 오류가 발생했습니다.' } },
        { status: 400 }
      );
    }

    // 성공 응답 (보안상 이메일이 존재하는지 여부는 알려주지 않음)
    return NextResponse.json(
      { message: '비밀번호 재설정 이메일을 발송했습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password API error:', error);
    
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
