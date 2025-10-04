import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateRequestSchema } from '@/domains/request/types';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/requests/[id] - 특정 요청 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // 요청 조회 (RLS 정책에 따라 필터링됨)
    const { data: request, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get request error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '요청을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: '요청을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보 별도 조회
    const userIds = [request.requester_id];
    if (request.assignee_id) {
      userIds.push(request.assignee_id);
    }

    let userProfiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', userIds);
      
      userProfiles = profiles || [];
    }

    // 데이터 변환
    const transformedRequest = {
      ...request,
      requester: userProfiles.find(p => p.id === request.requester_id) || {
        id: request.requester_id,
        email: '알 수 없음',
        role: 'unknown',
      },
      assignee: request.assignee_id ? 
        (userProfiles.find(p => p.id === request.assignee_id) || {
          id: request.assignee_id,
          email: '알 수 없음',
          role: 'unknown',
        }) : undefined,
    };

    return NextResponse.json({ request: transformedRequest });
  } catch (error) {
    console.error('Get request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/requests/[id] - 요청 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = CreateRequestSchema.parse(body);
    
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 기존 요청 조회 (권한 확인용)
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

    // 권한 확인 (profiles 테이블에서 조회)
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

    const canUpdate = 
      profile.role === 'admin' || // 관리자는 모든 요청 수정 가능
      (profile.role === 'designer' && existingRequest.requester_id === user.id) || // 설계자는 자신의 요청 수정 가능
      (profile.role === 'analyst' && existingRequest.assignee_id === user.id); // 해석자는 담당 요청 수정 가능

    if (!canUpdate) {
      return NextResponse.json(
        { error: '요청을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 수정
    const { data: updatedRequest, error } = await supabase
      .from('requests')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update request error:', error);
      return NextResponse.json(
        { error: '요청 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Update request error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: '입력 데이터가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id] - 요청 삭제
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

    // 권한 확인 (관리자만 삭제 가능)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: '요청을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 삭제
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete request error:', error);
      return NextResponse.json(
        { error: '요청 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '요청이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
