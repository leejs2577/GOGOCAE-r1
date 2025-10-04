import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/domains/request/types';

/**
 * 파일 업로드 관련 유틸리티 함수들
 */

// 파일명 안전화 (한글, 특수문자 처리 및 고유성 보장)
export function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : '';
  
  // 타임스탬프 + 랜덤 ID + UUID로 완전히 고유한 파일명 생성
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  
  return `${timestamp}_${randomId}_${uuid}${extension}`;
}

// 파일 확장자별 MIME 타입 매핑
export function getFileTypeFromExtension(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'step': 'application/step',
    'stp': 'application/step',
    'iges': 'application/iges',
    'igs': 'application/iges',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
}

// 파일 유효성 검사
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${MAX_FILE_SIZE / (1024 * 1024)}MB를 초과할 수 없습니다.`
    };
  }

  const fileType = file.type || getFileTypeFromExtension(file.name);
  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return {
      valid: false,
      error: '지원하지 않는 파일 형식입니다.'
    };
  }

  return { valid: true };
}

// 파일 경로 생성
export function generateFilePath(requestId: string, userId: string, safeFileName: string): string {
  return `${requestId}/${userId}/${safeFileName}`;
}

// 파일 업로드 메타데이터 생성
export function createFileMetadata(
  originalFileName: string,
  safeFileName: string,
  fileCategory: 'request' | 'report',
  specialNotes?: string
) {
  return {
    originalFileName,
    safeFileName,
    type: fileCategory,
    uploadedAt: new Date().toISOString(),
    ...(specialNotes && { specialNotes })
  };
}
