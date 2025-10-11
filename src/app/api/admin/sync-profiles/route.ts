import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 수동으로 누락된 프로필 생성하는 대안 방법
async function createMissingProfilesManually(supabase: any, currentUser: any) {
  try {
    // 알려진 사용자 이메일 목록 (실제 데이터로 대체)
    const knownUsers = [
      { email: 'ljs_whiteman@naver.com', role: 'designer', full_name: '설계자' },
      { email: 'leejs2577@gmail.com', role: 'analyst', full_name: '해석자' },
      { email: 'leejs2577@hsrna.com', role: 'admin', full_name: '관리자' }
    ];

    // 현재 profiles 테이블의 모든 사용자 조회
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email');

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return NextResponse.json(
        { error: '프로필 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    const existingEmails = new Set(existingProfiles?.map(p => p.email) || []);
    const missingUsers = knownUsers.filter(user => !existingEmails.has(user.email));

    console.log('Missing users to create:', missingUsers);

    const createdProfiles = [];

    // 누락된 프로필 생성
    for (const userInfo of missingUsers) {
      const profileData = {
        email: userInfo.email,
        full_name: userInfo.full_name,
        role: userInfo.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (createError) {
        console.error(`Error creating profile for ${userInfo.email}:`, createError);
      } else {
        createdProfiles.push(createdProfile);
        console.log(`Created profile for ${userInfo.email}`);
      }
    }

    // 최종 프로필 목록 조회
    const { data: allProfiles, error: finalFetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      message: '프로필 동기화가 완료되었습니다. (수동 방법)',
      details: {
        knownUsersCount: knownUsers.length,
        existingProfilesCount: existingProfiles?.length || 0,
        missingProfilesCount: missingUsers.length,
        createdProfilesCount: createdProfiles.length,
        totalProfilesCount: allProfiles?.length || 0,
        createdProfiles: createdProfiles,
        allProfiles: allProfiles || []
      }
    });
  } catch (error) {
    console.error('Manual profile creation error:', error);
    return NextResponse.json(
      { error: '수동 프로필 생성 중 오류가 발생했습니다.', details: error },
      { status: 500 }
    );
  }
}

// POST /api/admin/sync-profiles - 누락된 프로필 동기화 (관리자 전용)
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // Supabase Auth의 모든 사용자 조회
    console.log('Attempting to fetch auth users...');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    
    console.log('Auth users result:', { authUsers, authUsersError });
    
    if (authUsersError) {
      console.error('Auth users fetch error:', authUsersError);
      console.error('Error details:', {
        message: authUsersError.message,
        status: authUsersError.status
      });
      
      // Admin API 실패 시 대안 방법 사용
      console.log('Falling back to manual profile creation...');
      return await createMissingProfilesManually(supabase, user);
    }

    // 현재 profiles 테이블의 모든 사용자 조회
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return NextResponse.json(
        { error: '프로필 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    const authUserIds = authUsers.users.map(u => u.id);

    // 누락된 프로필 찾기
    const missingUserIds = authUserIds.filter(id => !existingProfileIds.has(id));
    
    console.log('Auth users count:', authUsers.users.length);
    console.log('Existing profiles count:', existingProfiles?.length || 0);
    console.log('Missing profile IDs:', missingUserIds);

    const createdProfiles = [];

    // 누락된 프로필 생성
    for (const userId of missingUserIds) {
      const authUser = authUsers.users.find(u => u.id === userId);
      if (authUser) {
        const profileData = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || '',
          role: authUser.user_metadata?.role || 'designer',
          created_at: authUser.created_at,
          updated_at: authUser.updated_at || new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        if (createError) {
          console.error(`Error creating profile for ${userId}:`, createError);
        } else {
          createdProfiles.push(createdProfile);
          console.log(`Created profile for ${authUser.email}`);
        }
      }
    }

    // 최종 프로필 목록 조회
    const { data: allProfiles, error: finalFetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      message: '프로필 동기화가 완료되었습니다.',
      details: {
        authUsersCount: authUsers.users.length,
        existingProfilesCount: existingProfiles?.length || 0,
        missingProfilesCount: missingUserIds.length,
        createdProfilesCount: createdProfiles.length,
        totalProfilesCount: allProfiles?.length || 0,
        createdProfiles: createdProfiles,
        allProfiles: allProfiles || []
      }
    });
  } catch (error) {
    console.error('Sync profiles API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    );
  }
}
