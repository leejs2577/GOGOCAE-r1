import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
    fileId: string;
  }>;
}

// DELETE /api/requests/[id]/files/[fileId] - 파일 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
      .select('requester_id')
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

    // 파일 카테고리에 따른 삭제 권한
    let canDelete = false;
    if (profile?.role === 'admin') {
      canDelete = true;
    } else if (file.file_category === 'request') {
      // 요청 파일은 설계자만 삭제 가능
      canDelete = profile?.role === 'designer' && request.requester_id === user.id;
    } else if (file.file_category === 'report') {
      // 보고서 파일은 해석자만 삭제 가능 (담당자일 때)
      canDelete = profile?.role === 'analyst' && file.uploaded_by === user.id;
    }

    if (!canDelete) {
      return NextResponse.json(
        { error: '파일을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 파일 메타데이터 삭제
    const { error: deleteError } = await supabase
      .from('request_files')
      .delete()
      .eq('id', fileId);

    if (deleteError) {
      console.error('Delete file metadata error:', deleteError);
      return NextResponse.json(
        { error: '파일 메타데이터 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 임시로 모든 파일을 request-files 버킷에서 삭제 (버킷 분리 전까지)
    const bucketName = 'request-files';
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([file.file_path]);

    if (storageError) {
      console.error('Delete storage file error:', storageError);
      // 메타데이터는 이미 삭제되었으므로 경고만 로그
      console.warn('Storage file deletion failed, but metadata was deleted');
    }

    return NextResponse.json({ 
      message: '파일이 성공적으로 삭제되었습니다.' 
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '파일 삭제 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}
