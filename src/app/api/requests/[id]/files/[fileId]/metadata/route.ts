import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; fileId: string }>;
}

// PUT /api/requests/[id]/files/[fileId]/metadata - 파일 메타데이터 업데이트
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: requestId, fileId } = await params;
    const { specialNotes } = await request.json();

    if (!specialNotes) {
      return NextResponse.json({ error: '특이사항이 필요합니다.' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 요청 정보 가져오기
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select('assignee_id')
      .eq('id', requestId)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ error: '요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 사용자 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: '사용자 프로필을 찾을 수 없습니다.' }, { status: 500 });
    }

    // 권한 확인 (담당자 또는 관리자만 가능)
    const canUpdate = 
      profile.role === 'admin' ||
      (profile.role === 'analyst' && requestData.assignee_id === user.id);

    if (!canUpdate) {
      return NextResponse.json(
        { error: '메타데이터를 업데이트할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 파일 메타데이터 업데이트
    const { data: updatedFile, error: updateError } = await supabase
      .from('request_files')
      .update({
        metadata: supabase.raw(`metadata || '{"specialNotes": "${specialNotes}"}'::jsonb`),
        updated_at: new Date().toISOString(),
      })
      .eq('id', fileId)
      .eq('request_id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('File metadata update error:', updateError);
      return NextResponse.json({ error: '메타데이터 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ file: updatedFile });
  } catch (error) {
    console.error('File metadata update API error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '메타데이터 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

