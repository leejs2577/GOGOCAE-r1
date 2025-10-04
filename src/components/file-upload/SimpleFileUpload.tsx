'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/domains/request/types';
import { validateFile } from '@/lib/file-upload';
import { FileService } from '@/services/fileService';

interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface SimpleFileUploadProps {
  requestId: string;
  fileCategory: 'request' | 'report';
  onUploadComplete: (fileId: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  specialNotes?: string;
}

export default function SimpleFileUpload({
  requestId,
  fileCategory,
  onUploadComplete,
  onUploadError,
  disabled = false,
  specialNotes
}: SimpleFileUploadProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, FileUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (disabled || isUploading) return;

    // 파일 거부 사유 처리
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        errors.forEach((err: any) => {
          if (err.code === 'file-too-large') {
            toast({
              title: "파일 크기 초과",
              description: `${file.name}은(는) ${MAX_FILE_SIZE / (1024 * 1024)}MB를 초과합니다.`,
              variant: "destructive",
            });
          } else if (err.code === 'file-invalid-type') {
            toast({
              title: "지원하지 않는 파일 형식",
              description: `${file.name}은(는) 허용되지 않는 파일 형식입니다.`,
              variant: "destructive",
            });
          }
        });
      });
    }

    // 유효한 파일만 추가
    const validFiles = acceptedFiles.filter(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "파일 오류",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, [disabled, isUploading, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    accept: ALLOWED_FILE_TYPES.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    multiple: true,
    disabled: disabled || isUploading,
  });

  // 파일 삭제
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[selectedFiles[index]?.name];
      return newProgress;
    });
  };

  // 파일 업로드
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "파일 없음",
        description: "업로드할 파일을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const results: string[] = [];

    try {
      for (const file of selectedFiles) {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { fileName: file.name, progress: 0, status: 'uploading' }
        }));

        const result = await FileService.uploadFile({
          requestId,
          file,
          fileCategory,
          specialNotes
        });

        if (result.success) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { fileName: file.name, progress: 100, status: 'completed' }
          }));
          results.push(result.fileId);
        } else {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { 
              fileName: file.name, 
              progress: 0, 
              status: 'error', 
              error: result.error 
            }
          }));
          onUploadError?.(result.error || '업로드 실패');
        }
      }

      if (results.length > 0) {
        toast({
          title: "업로드 완료",
          description: `${results.length}개 파일이 성공적으로 업로드되었습니다.`,
        });
        
        // 첫 번째 파일 ID로 완료 콜백 호출
        onUploadComplete(results[0]);
        
        // 업로드 완료 후 파일 목록 초기화
        setSelectedFiles([]);
        setUploadProgress({});
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "업로드 오류",
        description: "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      onUploadError?.('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 드래그 앤 드롭 영역 */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? '파일을 놓아주세요' : '파일을 드래그하거나 클릭하여 선택하세요'}
        </p>
        <p className="text-sm text-gray-500">
          최대 {MAX_FILE_SIZE / (1024 * 1024)}MB, 지원 형식: PDF, STEP, IGES, 이미지, Office 문서
        </p>
      </div>

      {/* 선택된 파일 목록 */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">선택된 파일 ({selectedFiles.length})</h4>
            <div className="space-y-3">
              {selectedFiles.map((file, index) => {
                const progress = uploadProgress[file.name];
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                        {progress && (
                          <div className="mt-2">
                            <Progress value={progress.progress} className="h-2" />
                            <div className="text-xs text-gray-500 mt-1">
                              {progress.status === 'uploading' && '업로드 중...'}
                              {progress.status === 'completed' && '완료'}
                              {progress.status === 'error' && progress.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업로드 버튼 */}
      {selectedFiles.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={uploadFiles}
            disabled={disabled || isUploading}
            className="min-w-32"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                업로드 ({selectedFiles.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

