import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 테스트용 프로필 생성 API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 클라이언트로 프로필 확인 및 생성
    const adminSupabase = createServerSupabaseAdmin();
    
    // 프로필이 이미 존재하는지 확인
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { message: '프로필이 이미 존재합니다.', profile: existingProfile },
        { status: 200 }
      );
    }

    // 프로필 생성
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: user.user_metadata?.role || 'designer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: '프로필 생성 중 오류가 발생했습니다.', details: profileError },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: '프로필이 성공적으로 생성되었습니다.', profile },
      { status: 201 }
    );
  } catch (error) {
    console.error('Test profile creation error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
