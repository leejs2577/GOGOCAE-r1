/**
 * 파일 업로드/다운로드 서비스
 */

import { validateFile, sanitizeFileName, generateFilePath, createFileMetadata, getFileTypeFromExtension } from '@/lib/file-upload';

export interface UploadFileParams {
  requestId: string;
  file: File;
  fileCategory: 'request' | 'report';
  specialNotes?: string;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  fileSize: number;
  success: boolean;
  error?: string;
}

export class FileService {
  private static readonly BUCKET_NAME = 'request-files';
  private static readonly UPLOAD_TIMEOUT = 60000; // 60초

  /**
   * 파일 업로드
   */
  static async uploadFile(params: UploadFileParams): Promise<UploadResult> {
    const { requestId, file, fileCategory, specialNotes } = params;

    try {
      // 1. 파일 유효성 검사
      const validation = validateFile(file);
      if (!validation.valid) {
        return {
          fileId: '',
          fileName: file.name,
          fileSize: file.size,
          success: false,
          error: validation.error
        };
      }

      // 2. 파일 정보 준비
      const fileType = file.type || getFileTypeFromExtension(file.name);
      const safeFileName = sanitizeFileName(file.name);

      // 3. 업로드 URL 생성 요청
      const uploadUrlResponse = await fetch(`/api/requests/${requestId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: fileType,
          metadata: createFileMetadata(file.name, safeFileName, fileCategory, specialNotes)
        }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.error || `업로드 URL 생성 실패: ${uploadUrlResponse.status}`);
      }

      const uploadData = await uploadUrlResponse.json();

      // 4. Supabase Storage에 파일 업로드
      const uploadResponse = await fetch(uploadData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': fileType,
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`파일 업로드 실패: ${uploadResponse.status} - ${errorText}`);
      }

      return {
        fileId: uploadData.fileId,
        fileName: file.name,
        fileSize: file.size,
        success: true
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        fileId: '',
        fileName: file.name,
        fileSize: file.size,
        success: false,
        error: error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 파일 다운로드
   */
  static async downloadFile(requestId: string, fileId: string): Promise<{ downloadUrl: string; fileName: string } | null> {
    try {
      const response = await fetch(`/api/requests/${requestId}/files/${fileId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '다운로드 URL 생성에 실패했습니다.');
      }

      const data = await response.json();
      return {
        downloadUrl: data.downloadUrl,
        fileName: data.fileName
      };
    } catch (error) {
      console.error('File download error:', error);
      return null;
    }
  }

  /**
   * 파일 삭제
   */
  static async deleteFile(requestId: string, fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/requests/${requestId}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 삭제에 실패했습니다.');
      }

      return true;
    } catch (error) {
      console.error('File delete error:', error);
      return false;
    }
  }

  /**
   * 파일 목록 조회
   */
  static async getFiles(requestId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/requests/${requestId}/files`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 목록 조회에 실패했습니다.');
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Get files error:', error);
      return [];
    }
  }
}

