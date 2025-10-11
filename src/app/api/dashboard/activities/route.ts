import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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

    // 먼저 notifications 테이블에서 활동 조회 시도
    const { data: notifications, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    let activities: Activity[] = [];

    if (!notificationError && notifications && notifications.length > 0) {
      // notifications 테이블에 데이터가 있으면 사용
      activities = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        description: notification.message,
        timestamp: notification.created_at,
        user_name: userRole === 'designer' ? '담당자' : '사용자',
        request_id: notification.request_id || '',
        request_title: notification.title
      }));
    } else {
      // notifications 테이블에 데이터가 없으면 기존 요청 데이터로 활동 생성
      let query = supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // 역할별 필터링
      switch (userRole) {
        case 'designer':
          query = query.eq('requester_id', user.id);
          break;
        case 'analyst':
          query = query.or(`assignee_id.is.null,assignee_id.eq.${user.id}`);
          break;
        case 'admin':
          // 관리자는 모든 요청
          break;
        default:
          // 기본적으로 설계자 권한으로 처리
          query = query.eq('requester_id', user.id);
      }

      const { data: requests, error: requestError } = await query;

      if (requestError) {
        console.error('Failed to fetch requests:', requestError);
        return NextResponse.json(
          { error: '활동 데이터를 가져오는데 실패했습니다.' },
          { status: 500 }
        );
      }

      // 요청 데이터로부터 활동 생성
      const tempActivities: Activity[] = [];

      if (requests) {
        for (const request of requests) {
          // 요청 생성 활동
          tempActivities.push({
            id: `${request.id}_created`,
            type: 'request_created',
            title: '새 요청이 생성되었습니다',
            description: `"${request.title}" 요청이 생성되었습니다`,
            timestamp: request.created_at,
            user_name: userRole === 'designer' ? '담당자' : '사용자',
            request_id: request.id,
            request_title: request.title
          });

          // 담당자 지정 활동
          if (request.assignee_id && request.status === 'assigned') {
            tempActivities.push({
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
            tempActivities.push({
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
            tempActivities.push({
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
      tempActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // 최대 20개 활동만 반환
      activities = tempActivities.slice(0, 20);
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    return NextResponse.json(
      { error: '활동 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
