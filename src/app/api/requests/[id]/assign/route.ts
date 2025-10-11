import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/requests/[id]/assign - 요청 담당자 지정
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log('Assign request - ID:', id);
    const supabase = await createServerSupabaseClient();

    // 요청 본문 읽기
    const body = await request.json();
    const { assignee_id } = body;

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Assign request - User:', user?.id, 'Auth error:', authError);
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 역할 확인 (해석자 또는 관리자만 담당자 지정 가능)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Assign request - Profile:', profile);
    if (!profile || !['analyst', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: '담당자 지정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('id, title, requester_id, assignee_id, status')
      .eq('id', id)
      .single();

    console.log('Assign request - Existing request:', existingRequest, 'Fetch error:', fetchError);
    if (fetchError) {
      console.error('Fetch request error:', fetchError);
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 담당자가 있는 경우 확인
    if (existingRequest.assignee_id && existingRequest.assignee_id !== assignee_id) {
      return NextResponse.json(
        { error: '이미 다른 해석자가 담당하고 있습니다.' },
        { status: 400 }
      );
    }

    // 담당자 지정 및 상태 업데이트
    const updateData: any = {
      assignee_id: assignee_id,
      updated_at: new Date().toISOString(),
    };

    // 상태가 'pending'인 경우 'assigned'로 변경
    if (existingRequest.status === 'pending') {
      updateData.status = 'assigned';
    }

    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Assign request error:', error);
      return NextResponse.json(
        { error: '담당자 지정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 담당자에게 알림 생성
    await createNotification({
      userId: assignee_id,
      type: 'request_assigned',
      title: '새 요청이 배정되었습니다',
      message: `"${existingRequest.title}" 요청의 담당자로 지정되었습니다.`,
      relatedRequestId: id,
    });

    // 요청자에게도 알림 생성
    if (existingRequest.requester_id !== assignee_id) {
      await createNotification({
        userId: existingRequest.requester_id,
        type: 'request_updated',
        title: '요청에 담당자가 배정되었습니다',
        message: `"${existingRequest.title}" 요청에 담당자가 배정되었습니다.`,
        relatedRequestId: id,
      });
    }

    return NextResponse.json({
      request: updatedRequest,
      message: '담당자로 지정되었습니다.'
    });
  } catch (error) {
    console.error('Assign request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/requests/[id]/assign - 요청 담당자 지정 (기존 방식 호환)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log('Assign request - ID:', id);
    const supabase = await createServerSupabaseClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Assign request - User:', user?.id, 'Auth error:', authError);
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 역할 확인 (해석자 또는 관리자만 담당자 지정 가능)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('Assign request - Profile:', profile);
    if (!profile || !['analyst', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: '담당자 지정 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('id, title, requester_id, assignee_id, status')
      .eq('id', id)
      .single();

    console.log('Assign request - Existing request:', existingRequest, 'Fetch error:', fetchError);
    if (fetchError) {
      console.error('Fetch request error:', fetchError);
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 담당자가 있는 경우 확인
    if (existingRequest.assignee_id && existingRequest.assignee_id !== user.id) {
      return NextResponse.json(
        { error: '이미 다른 해석자가 담당하고 있습니다.' },
        { status: 400 }
      );
    }

    // 담당자 지정 및 상태 업데이트
    const updateData: any = {
      assignee_id: user.id,
      updated_at: new Date().toISOString(),
    };

    // 상태가 'pending'인 경우 'assigned'로 변경
    if (existingRequest.status === 'pending') {
      updateData.status = 'assigned';
    }

    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Assign request error:', error);
      return NextResponse.json(
        { error: '담당자 지정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 담당자(현재 사용자)에게 알림 생성
    await createNotification({
      userId: user.id,
      type: 'request_assigned',
      title: '새 요청이 배정되었습니다',
      message: `"${existingRequest.title}" 요청의 담당자로 지정되었습니다.`,
      relatedRequestId: id,
    });

    // 요청자에게도 알림 생성
    if (existingRequest.requester_id !== user.id) {
      await createNotification({
        userId: existingRequest.requester_id,
        type: 'request_updated',
        title: '요청에 담당자가 배정되었습니다',
        message: `"${existingRequest.title}" 요청에 담당자가 배정되었습니다.`,
        relatedRequestId: id,
      });
    }

    return NextResponse.json({
      request: updatedRequest,
      message: '담당자로 지정되었습니다.'
    });
  } catch (error) {
    console.error('Assign request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id]/assign - 담당자 지정 해제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    if (!profile || !['analyst', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: '담당자 지정 해제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 기존 요청 조회
    const { data: existingRequest, error: fetchError } = await supabase
      .from('requests')
      .select('id, title, requester_id, assignee_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Fetch request error:', fetchError);
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 담당자인지 확인
    if (existingRequest.assignee_id !== user.id && profile.role !== 'admin') {
      return NextResponse.json(
        { error: '본인이 담당한 요청만 해제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 담당자 지정 해제 및 상태 업데이트
    const updateData: any = {
      assignee_id: null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Unassign request error:', error);
      return NextResponse.json(
        { error: '담당자 지정 해제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      request: updatedRequest,
      message: '담당자 지정이 해제되었습니다.' 
    });
  } catch (error) {
    console.error('Unassign request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
