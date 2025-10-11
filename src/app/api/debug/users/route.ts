import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/debug/users - 디버깅용 사용자 정보 조회
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    console.log('Current user ID:', user.id);
    console.log('Current user email:', user.email);

    // 현재 사용자 프로필 확인
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('Current profile:', currentProfile);
    console.log('Current profile error:', currentProfileError);

    // 모든 프로필 조회
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('All profiles:', allProfiles);
    console.log('All profiles error:', allProfilesError);

    // Supabase Auth 사용자 목록도 확인
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

    console.log('Auth users:', authUsers?.users?.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at
    })));

    return NextResponse.json({
      debug: {
        currentUser: {
          id: user.id,
          email: user.email,
        },
        currentProfile,
        currentProfileError,
        allProfiles,
        allProfilesError,
        authUsers: authUsers?.users?.map(u => ({
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          email_confirmed_at: u.email_confirmed_at
        })) || [],
        authUsersError,
        profilesCount: allProfiles?.length || 0,
        authUsersCount: authUsers?.users?.length || 0
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    );
  }
}

