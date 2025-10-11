import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 사용자 정보 디버깅 API
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createServerSupabaseAdmin();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 일반 클라이언트로 프로필 조회 시도
    const { data: profileNormal, error: profileNormalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 관리자 클라이언트로 프로필 조회 시도
    const { data: profileAdmin, error: profileAdminError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      debug: {
        userId: user.id,
        userEmail: user.email,
        userMetadata: user.user_metadata,
        profileNormal: {
          data: profileNormal,
          error: profileNormalError?.message || null,
        },
        profileAdmin: {
          data: profileAdmin,
          error: profileAdminError?.message || null,
        },
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  } catch (error) {
    console.error('Debug user info API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

