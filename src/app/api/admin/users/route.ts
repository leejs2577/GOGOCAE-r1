import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/admin/users - 모든 사용자 목록 조회 (관리자 전용)
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

    // 모든 사용자 프로필 조회
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Fetched users:', users);
    console.log('Users count:', users?.length || 0);

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json(
        { error: '사용자 목록을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      users: users || [],
      debug: {
        count: users?.length || 0,
        currentUserId: user.id
      }
    });
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
