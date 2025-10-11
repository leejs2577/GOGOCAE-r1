/**
 * 디버그 API - 프로필 상태 확인
 * 개발 중에만 사용하세요
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/supabase/utils';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createServerSupabaseAdmin();

    // 1. 현재 인증 상태 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        status: 'error',
        message: '인증되지 않음',
        authError: authError?.message,
      });
    }

    // 2. auth.users 테이블에서 사용자 정보 확인
    const { data: authUser, error: authUserError } = await adminSupabase.auth.admin.getUserById(user.id);

    // 3. profiles 테이블에서 프로필 확인
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 4. getUserProfile 함수 테스트
    const utilProfile = await getUserProfile(user.id);

    // 5. RLS 정책 확인을 위해 일반 클라이언트로도 조회
    const { data: rlsProfile, error: rlsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      status: 'success',
      data: {
        userId: user.id,
        email: user.email,

        authUserMetadata: authUser?.user?.user_metadata,

        profileExists: !!profile,
        profile: profile || null,
        profileError: profileError?.message || null,

        rlsProfileExists: !!rlsProfile,
        rlsProfile: rlsProfile || null,
        rlsError: rlsError?.message || null,

        utilProfileExists: !!utilProfile,
        utilProfile: utilProfile || null,

        diagnosis: {
          authWorks: !authError,
          profileInDb: !!profile,
          rlsAllowsRead: !!rlsProfile,
          utilFunctionWorks: !!utilProfile,
          recommendation: !profile
            ? '프로필이 데이터베이스에 없습니다. 마이그레이션을 실행하세요.'
            : !rlsProfile
            ? 'RLS 정책이 읽기를 차단하고 있습니다. 마이그레이션을 실행하세요.'
            : '모든 것이 정상입니다!'
        }
      }
    });
  } catch (error) {
    console.error('Debug profile error:', error);
    return NextResponse.json({
      status: 'error',
      message: '디버그 중 오류 발생',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

