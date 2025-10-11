import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// POST /api/admin/create-profiles - 누락된 프로필 직접 생성 (관리자 전용)
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

    // 알려진 사용자 정보 (실제 가입된 사용자들)
    const knownUsers = [
      { email: 'ljs_whiteman@naver.com', role: 'designer', full_name: '설계자' },
      { email: 'leejs2577@gmail.com', role: 'analyst', full_name: '해석자' },
      { email: 'leejs2577@hsrna.com', role: 'admin', full_name: '관리자' }
    ];

    console.log('Creating profiles for known users:', knownUsers);

    const createdProfiles = [];
    const errors = [];

    // 각 사용자에 대해 프로필 생성 시도
    for (const userInfo of knownUsers) {
      try {
        const profileData = {
          email: userInfo.email,
          full_name: userInfo.full_name,
          role: userInfo.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log(`Creating profile for ${userInfo.email}:`, profileData);

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'email',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (createError) {
          console.error(`Error creating profile for ${userInfo.email}:`, createError);
          errors.push({ email: userInfo.email, error: createError.message });
        } else {
          console.log(`Successfully created/updated profile for ${userInfo.email}:`, createdProfile);
          createdProfiles.push(createdProfile);
        }
      } catch (error) {
        console.error(`Exception creating profile for ${userInfo.email}:`, error);
        errors.push({ email: userInfo.email, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // 최종 프로필 목록 조회
    const { data: allProfiles, error: finalFetchError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (finalFetchError) {
      console.error('Final fetch error:', finalFetchError);
    }

    return NextResponse.json({
      message: '프로필 생성이 완료되었습니다.',
      details: {
        knownUsersCount: knownUsers.length,
        createdProfilesCount: createdProfiles.length,
        errorCount: errors.length,
        totalProfilesCount: allProfiles?.length || 0,
        createdProfiles: createdProfiles,
        errors: errors,
        allProfiles: allProfiles || []
      }
    });
  } catch (error) {
    console.error('Create profiles API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error },
      { status: 500 }
    );
  }
}

