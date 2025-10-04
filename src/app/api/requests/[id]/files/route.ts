import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/domains/request/types';
import { sanitizeFileName, generateFilePath, createFileMetadata, getFileTypeFromExtension } from '@/lib/file-upload';

export const runtime = 'nodejs';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/requests/[id]/files - 요청의 파일 목록 조회
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

    // 요청 권한 확인
    const { data: requestData } = await supabase
      .from('requests')
      .select('requester_id, assignee_id')
      .eq('id', id)
      .single();

    if (!requestData) {
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

    const canAccess = 
      profile?.role === 'admin' ||
      requestData.requester_id === user.id ||
      requestData.assignee_id === user.id;

    if (!canAccess) {
      return NextResponse.json(
        { error: '이 요청의 파일에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 파일 목록 조회
    const { data: files, error } = await supabase
      .from('request_files')
      .select('*')
      .eq('request_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Get files error:', error);
      return NextResponse.json(
        { error: '파일 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '파일 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}

// POST /api/requests/[id]/files - 파일 업로드 URL 생성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fileName, fileSize, fileType } = body;
    
    console.log('POST /api/requests/[id]/files - Request received:', {
      requestId: id,
      fileName,
      fileSize,
      fileType
    });
    
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check result:', { user: user?.id, authError });
    
    if (authError || !user) {
      console.log('Auth failed:', authError);
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 권한 확인 (설계자, 해석자 또는 관리자 업로드 가능)
    const { data: requestData } = await supabase
      .from('requests')
      .select('requester_id, assignee_id')
      .eq('id', id)
      .single();

    if (!requestData) {
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

    console.log('Upload permission check:', {
      userRole: profile?.role,
      userId: user.id,
      requesterId: requestData.requester_id,
      assigneeId: requestData.assignee_id,
      isAdmin: profile?.role === 'admin',
      isDesignerAndRequester: profile?.role === 'designer' && requestData.requester_id === user.id,
      isAnalystAndAssignee: profile?.role === 'analyst' && requestData.assignee_id === user.id,
    });

    const canUpload = 
      profile?.role === 'admin' ||
      (profile?.role === 'designer' && requestData.requester_id === user.id) ||
      (profile?.role === 'analyst' && requestData.assignee_id === user.id);

    console.log('Can upload:', canUpload);

    if (!canUpload) {
      console.log('Upload denied for user:', user.id, 'with role:', profile?.role);
      return NextResponse.json(
        { error: '파일을 업로드할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 파일 크기 검증 (50MB - Supabase 무료 버전 제한)
    if (fileSize > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 허용된 파일 타입 검증
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // 파일 카테고리 결정 (메타데이터에서 확인)
    const fileCategory = body.metadata?.type === 'report' ? 'report' : 'request';
    const bucketName = 'request-files';
    
    // 파일 정보 준비
    const safeFileName = sanitizeFileName(fileName);
    const filePath = generateFilePath(id, user.id, safeFileName);

    // 파일 메타데이터를 DB에 먼저 저장
    const { data: fileMetadata, error: metadataError } = await supabase
      .from('request_files')
      .insert({
        request_id: id,
        file_name: fileName, // 원본 파일명 유지 (사용자에게 표시용)
        file_path: filePath, // 안전한 파일명 사용 (저장용)
        file_size: fileSize,
        file_type: fileType,
        content_type: fileType,
        uploaded_by: user.id,
        file_category: fileCategory,
        metadata: body.metadata || createFileMetadata(fileName, safeFileName, fileCategory),
      })
      .select()
      .single();

    if (metadataError) {
      console.error('File metadata insert error:', metadataError);
      return NextResponse.json(
        { error: '파일 메타데이터 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 업로드 URL 생성 (적절한 버킷 사용)
    console.log('Creating upload URL for path:', filePath, 'in bucket:', bucketName);
    console.log('File details:', {
      originalFileName: fileName,
      safeFileName: safeFileName,
      fileCategory: fileCategory,
      bucketName: bucketName
    });
    
    try {
      // 업로드 URL 생성 (createSignedUploadUrl 사용)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .createSignedUploadUrl(filePath);

      console.log('Upload URL creation result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Create upload URL error:', uploadError);
        // 메타데이터 롤백
        await supabase
          .from('request_files')
          .delete()
          .eq('id', fileMetadata.id);
        
        return NextResponse.json(
          { error: `업로드 URL 생성 중 오류가 발생했습니다: ${uploadError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        uploadUrl: uploadData.signedUrl,
        signedUrl: uploadData.signedUrl,
        path: filePath,
        fileId: fileMetadata.id,
      });
    } catch (error) {
      console.error('Upload URL creation exception:', error);
      // 메타데이터 롤백
      await supabase
        .from('request_files')
        .delete()
        .eq('id', fileMetadata.id);
      
      return NextResponse.json(
        { error: `업로드 URL 생성 중 예외가 발생했습니다: ${(error as Error).message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create upload URL error:', error);
    return NextResponse.json(
      { error: (error as Error).message || '업로드 URL 생성 중 오류가 발생했습니다.' },
      { status: 400 }
    );
  }
}
