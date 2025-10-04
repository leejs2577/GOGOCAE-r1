import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
}

// GET /api/requests/[id]/files/[fileId]/download - 파일 다운로드 URL 생성
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, fileId } = await params;
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 파일 정보 조회
    const { data: file, error: fileError } = await supabase
      .from('request_files')
      .select('*')
      .eq('id', fileId)
      .eq('request_id', id)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 요청 권한 확인
    const { data: request } = await supabase
      .from('requests')
      .select('requester_id, assignee_id')
      .eq('id', id)
      .single();

    if (!request) {
      return NextResponse.json(
        { error: '요청을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const canDownload = 
      profile?.role === 'admin' ||
      request.requester_id === user.id ||
      request.assignee_id === user.id;

    if (!canDownload) {
      return NextResponse.json(
        { error: '이 파일을 다운로드할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 임시로 모든 파일을 request-files 버킷에서 다운로드 (버킷 분리 전까지)
    const bucketName = 'request-files';
    
    // 다운로드 URL 생성 (5분 유효)
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(file.file_path, 300);

    if (downloadError) {
      console.error('Create download URL error:', downloadError);
      return NextResponse.json(
        { error: '다운로드 URL 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      downloadUrl: downloadData.signedUrl,
      fileName: file.file_name,
      fileSize: file.file_size,
      fileType: file.file_type
    });
  } catch (error) {
    console.error('Create download URL error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '다운로드 URL 생성 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}
