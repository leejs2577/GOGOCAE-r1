import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RequestStatus } from '@/domains/request/types';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// PUT /api/requests/[id]/status - 요청 상태 변경
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    // 상태 유효성 검사
    if (!Object.values(RequestStatus).includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태입니다.' },
        { status: 400 }
      );
    }
    
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Fetch request error:', fetchError);
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인
    const canUpdateStatus = 
      profile.role === 'admin' || // 관리자는 모든 요청 상태 변경 가능
      (profile.role === 'designer' && existingRequest.requester_id === user.id) || // 설계자는 자신의 요청 상태 변경 가능
      (profile.role === 'analyst' && existingRequest.assignee_id === user.id); // 해석자는 담당 요청 상태 변경 가능

    if (!canUpdateStatus) {
      return NextResponse.json(
        { error: '상태를 변경할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 상태 변경 규칙 검증
    const currentStatus = existingRequest.status;
    const newStatus = status;

    // 상태 변경 규칙
    const validTransitions: Record<string, string[]> = {
      [RequestStatus.PENDING]: [RequestStatus.ASSIGNED],
      [RequestStatus.ASSIGNED]: [RequestStatus.IN_PROGRESS, RequestStatus.PENDING],
      [RequestStatus.IN_PROGRESS]: [RequestStatus.COMPLETED, RequestStatus.ASSIGNED],
      [RequestStatus.COMPLETED]: [RequestStatus.IN_PROGRESS], // 완료된 요청을 다시 진행중으로 변경 가능
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `${currentStatus}에서 ${newStatus}로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 상태 업데이트
    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      return NextResponse.json(
        { error: '상태 변경 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 상태 변경 메시지
    const statusMessages: Record<string, string> = {
      [RequestStatus.PENDING]: '대기중으로 변경되었습니다.',
      [RequestStatus.ASSIGNED]: '담당자 지정됨으로 변경되었습니다.',
      [RequestStatus.IN_PROGRESS]: '진행중으로 변경되었습니다.',
      [RequestStatus.COMPLETED]: '완료로 변경되었습니다.',
    };

    const statusKoreanNames: Record<string, string> = {
      [RequestStatus.PENDING]: '대기중',
      [RequestStatus.ASSIGNED]: '담당자 지정됨',
      [RequestStatus.IN_PROGRESS]: '진행중',
      [RequestStatus.COMPLETED]: '완료',
    };

    // 알림 생성 - 관련된 사용자들에게 전송
    const notificationRecipients: string[] = [];

    // 요청자에게 알림
    if (existingRequest.requester_id !== user.id) {
      notificationRecipients.push(existingRequest.requester_id);
    }

    // 담당자에게 알림 (담당자가 있고, 현재 사용자가 아닌 경우)
    if (existingRequest.assignee_id && existingRequest.assignee_id !== user.id) {
      notificationRecipients.push(existingRequest.assignee_id);
    }

    // 알림 전송
    const notificationType = newStatus === RequestStatus.COMPLETED ? 'request_completed' : 'request_updated';
    for (const recipientId of notificationRecipients) {
      await createNotification({
        userId: recipientId,
        type: notificationType,
        title: '요청 상태가 변경되었습니다',
        message: `"${existingRequest.title}" 요청의 상태가 "${statusKoreanNames[newStatus]}"로 변경되었습니다.`,
        relatedRequestId: id,
      });
    }

    return NextResponse.json({
      request: updatedRequest,
      message: statusMessages[newStatus] || '상태가 변경되었습니다.'
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
