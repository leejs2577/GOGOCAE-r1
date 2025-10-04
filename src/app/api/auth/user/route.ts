import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: { message: '인증이 필요합니다.' } },
        { status: 401 }
      );
    }

    // 사용자 프로필 정보 조회
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
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
            id: user.id,
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
    console.error('Get user API error:', error);
    return NextResponse.json(
      { error: { message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
