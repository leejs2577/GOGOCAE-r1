import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 사용자 로그아웃
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Auth logout error:', error);
      return NextResponse.json(
        { error: { message: '로그아웃 중 오류가 발생했습니다.' } },
        { status: 400 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      { message: '로그아웃되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: { message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
