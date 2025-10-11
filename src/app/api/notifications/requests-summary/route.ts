import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 요청 요약 정보 조회 (알림 벨용)
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 역할 확인 (안전하게)
    const { getUserProfile } = await import('@/lib/supabase/utils');
    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userRole = profile.role;

    let query = supabase
      .from('requests')
      .select(`
        id,
        title,
        analysis_type,
        priority,
        status,
        created_at,
        requester_id,
        assignee_id
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // 역할별 필터링
    switch (userRole) {
      case 'designer':
        // 설계자: 자신이 요청한 프로젝트만
        query = query.eq('requester_id', user.id);
        break;
      case 'analyst':
        // 해석자: 담당자 미지정 프로젝트 + 자신이 담당하는 프로젝트
        query = query.or(`assignee_id.is.null,assignee_id.eq.${user.id}`);
        break;
      case 'admin':
        // 관리자: 모든 프로젝트
        break;
      default:
        // 기본적으로 설계자 권한으로 처리
        query = query.eq('requester_id', user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Failed to fetch requests summary:', error);
      return NextResponse.json(
        { error: '요청 요약을 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 요청 데이터 변환
    const requestSummary = (requests || []).map(request => ({
      id: request.id,
      title: request.title,
      analysis_type: request.analysis_type,
      priority: request.priority,
      status: request.status,
      created_at: request.created_at,
      requester_name: '사용자' // 간단히 표시
    }));

    return NextResponse.json({ requests: requestSummary });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
