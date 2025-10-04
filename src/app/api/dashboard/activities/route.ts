import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Activity {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_completed' | 'request_updated';
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
  request_id: string;
  request_title: string;
}

export async function GET() {
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

    // 최근 요청 데이터 가져오기 (최근 20개)
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch activities:', error);
      return NextResponse.json(
        { error: '활동 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 활동 데이터 생성
    const activities: Activity[] = [];

    if (requests) {
      for (const request of requests) {
        // 요청 생성 활동
        activities.push({
          id: `${request.id}_created`,
          type: 'request_created',
          title: '새로운 해석 요청이 생성되었습니다',
          description: `"${request.title}" 요청이 생성되었습니다`,
          timestamp: request.created_at,
          user_name: '사용자',
          request_id: request.id,
          request_title: request.title
        });

        // 담당자 지정 활동
        if (request.assignee_id && request.status === 'assigned') {
          activities.push({
            id: `${request.id}_assigned`,
            type: 'request_assigned',
            title: '담당자가 지정되었습니다',
            description: `"${request.title}" 요청에 담당자가 지정되었습니다`,
            timestamp: request.updated_at,
            user_name: '담당자',
            request_id: request.id,
            request_title: request.title
          });
        }

        // 진행 중으로 변경 활동
        if (request.status === 'in_progress') {
          activities.push({
            id: `${request.id}_progress`,
            type: 'request_updated',
            title: '작업이 진행 중입니다',
            description: `"${request.title}" 요청 작업이 시작되었습니다`,
            timestamp: request.updated_at,
            user_name: '담당자',
            request_id: request.id,
            request_title: request.title
          });
        }

        // 완료 활동
        if (request.status === 'completed') {
          activities.push({
            id: `${request.id}_completed`,
            type: 'request_completed',
            title: '작업이 완료되었습니다',
            description: `"${request.title}" 요청이 완료되었습니다`,
            timestamp: request.updated_at,
            user_name: '담당자',
            request_id: request.id,
            request_title: request.title
          });
        }
      }
    }

    // 시간순 정렬 (최신순)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 최대 15개 활동만 반환
    const recentActivities = activities.slice(0, 15);

    return NextResponse.json({ activities: recentActivities });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json(
      { error: '활동 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
