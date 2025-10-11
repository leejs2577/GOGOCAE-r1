import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 기존 요청 데이터를 기반으로 알림 생성
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자만 실행 가능
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

    // 모든 요청 데이터 가져오기
    const { data: requests, error: requestError } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestError) {
      console.error('Failed to fetch requests:', requestError);
      return NextResponse.json(
        { error: '요청 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ message: '마이그레이션할 요청 데이터가 없습니다.' });
    }

    // 모든 사용자 가져오기
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, role');

    if (profileError) {
      console.error('Failed to fetch profiles:', profileError);
      return NextResponse.json(
        { error: '사용자 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    const notifications = [];

    for (const request of requests) {
      // 모든 해석자에게 새 요청 생성 알림
      const analysts = profiles?.filter(p => p.role === 'analyst') || [];
      for (const analyst of analysts) {
        notifications.push({
          user_id: analyst.id,
          type: 'request_created',
          title: '새로운 해석 요청',
          message: `새로운 해석 요청 "${request.title}"이 생성되었습니다.`,
          request_id: request.id,
          read: false,
          created_at: request.created_at
        });
      }

      // 담당자 지정 알림
      if (request.assignee_id && request.status === 'assigned') {
        notifications.push({
          user_id: request.requester_id,
          type: 'request_assigned',
          title: '담당자 지정됨',
          message: `요청 "${request.title}"에 담당자가 지정되었습니다.`,
          request_id: request.id,
          read: false,
          created_at: request.updated_at
        });
      }

      // 상태 변경 알림
      if (request.status === 'in_progress') {
        notifications.push({
          user_id: request.requester_id,
          type: 'request_updated',
          title: '요청 상태 변경',
          message: `요청 "${request.title}"의 상태가 "진행 중"으로 변경되었습니다.`,
          request_id: request.id,
          read: false,
          created_at: request.updated_at
        });
      }

      // 완료 알림
      if (request.status === 'completed') {
        notifications.push({
          user_id: request.requester_id,
          type: 'request_completed',
          title: '작업 완료',
          message: `요청 "${request.title}"이 완료되었습니다.`,
          request_id: request.id,
          read: false,
          created_at: request.updated_at
        });
      }
    }

    // 알림 일괄 삽입
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error('Failed to insert notifications:', insertError);
        return NextResponse.json(
          { error: '알림 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      message: `${notifications.length}개의 알림이 생성되었습니다.`,
      count: notifications.length 
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

