import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/requests/[id]/files/upload - 파일 업로드 완료 후 메타데이터 저장
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fileName, fileSize, fileType, storagePath } = body;
    
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 중복 파일명 확인 제거 - 같은 이름의 파일 허용
    // (원본 파일명은 표시용이므로 중복 허용)

    // 파일 메타데이터 저장 (새로운 스키마에 맞게 수정)
    const { data: fileRecord, error } = await supabase
      .from('request_files')
      .insert({
        request_id: id,
        file_name: fileName,
        file_path: storagePath, // storage_path -> file_path로 변경
        file_size: fileSize,
        file_type: fileType,
        content_type: fileType, // content_type 필드 추가
        file_category: 'request', // file_category 필드 추가 (기본값: request)
        uploaded_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Save file metadata error:', error);
      return NextResponse.json(
        { error: '파일 메타데이터 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ file: fileRecord });
  } catch (error) {
    console.error('Upload file metadata error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '파일 메타데이터 저장 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}
