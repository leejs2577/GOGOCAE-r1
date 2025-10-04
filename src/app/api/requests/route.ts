import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateRequestSchema } from '@/domains/request/types';

// GET /api/requests - 요청 목록 조회
export async function GET(request: NextRequest) {
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

    // 요청 목록 조회 (RLS 정책에 따라 필터링됨)
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get requests error:', error);
      return NextResponse.json(
        { error: '요청 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 정보 별도 조회
    const requesterIds = [...new Set(requests.map(r => r.requester_id))];
    const assigneeIds = [...new Set(requests.map(r => r.assignee_id).filter(Boolean))];
    const allUserIds = [...requesterIds, ...assigneeIds];

    let userProfiles: any[] = [];
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', allUserIds);
      
      userProfiles = profiles || [];
    }

    // 각 요청에 대해 보고서 존재 여부 확인
    const requestsWithReports = await Promise.all(
      requests.map(async (request) => {
        const { data: reportFiles } = await supabase
          .from('request_files')
          .select('id')
          .eq('request_id', request.id)
          .eq('metadata->>type', 'report')
          .limit(1);

        return {
          ...request,
          has_report: (reportFiles && reportFiles.length > 0),
        };
      })
    );

    // 데이터 변환
    const transformedRequests = requestsWithReports.map(request => ({
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
    }));

    return NextResponse.json({ requests: transformedRequests });
  } catch (error) {
    console.error('Get requests error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/requests - 새 요청 생성
export async function POST(request: NextRequest) {
  try {
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

    // 사용자 역할 확인 (profiles 테이블에서 조회)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['designer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: '요청을 생성할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 새 요청 생성
    const { data: newRequest, error } = await supabase
      .from('requests')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        car_model: validatedData.car_model,
        analysis_type: validatedData.analysis_type,
        requested_deadline: validatedData.requested_deadline,
        priority: validatedData.priority,
        requester_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create request error:', error);
      return NextResponse.json(
        { error: '요청 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { request: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create request error:', error);
    
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
