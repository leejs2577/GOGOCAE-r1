import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/supabase/utils';

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

    // 안전하게 프로필 가져오기 (없으면 자동 생성)
    const profile = await getUserProfile(user.id);

    if (!profile) {
      console.error('Failed to get or create profile for user:', user.id);
      return NextResponse.json(
        { error: { message: '사용자 프로필을 가져올 수 없습니다.' } },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      {
        data: {
          user: {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
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
