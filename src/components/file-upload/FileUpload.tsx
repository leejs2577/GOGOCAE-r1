'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { FileUploadProgress, UploadResult, MAX_FILE_SIZE, ALLOWED_FILE_TYPES, FILE_TYPE_LABELS } from '@/domains/request/types';

interface FileUploadProps {
  requestId: string;
  onUploadComplete: (result: UploadResult) => void;
  disabled?: boolean;
  acceptedFileTypes?: string[];
  maxSize?: number;
}

export default function FileUpload({
  requestId,
  onUploadComplete,
  disabled = false,
  acceptedFileTypes = ALLOWED_FILE_TYPES,
  maxSize = MAX_FILE_SIZE
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file: File) => {
    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type;

    // 초기 상태 설정
    setUploadProgress(prev => [...prev, {
      fileName,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // 1. 업로드 URL 생성
      const uploadUrlResponse = await fetch(`/api/requests/${requestId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileSize,
          fileType
        })
      });

      if (!uploadUrlResponse.ok) {
        const error = await uploadUrlResponse.json();
        throw new Error(error.error || '업로드 URL 생성에 실패했습니다.');
      }

      const { uploadUrl, path } = await uploadUrlResponse.json();

      // 2. 파일 업로드 (진행률 추적)
      const xhr = new XMLHttpRequest();
      
      return new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => prev.map(item => 
              item.fileName === fileName 
                ? { ...item, progress }
                : item
            ));
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              // 3. 파일 메타데이터 저장
              const saveResponse = await fetch(`/api/requests/${requestId}/files/upload`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileName,
                  fileSize,
                  fileType,
                  storagePath: path
                })
              });

              if (!saveResponse.ok) {
                const error = await saveResponse.json();
                throw new Error(error.error || '파일 메타데이터 저장에 실패했습니다.');
              }

              const { file } = await saveResponse.json();

              // 완료 상태로 업데이트
              setUploadProgress(prev => prev.map(item => 
                item.fileName === fileName 
                  ? { ...item, progress: 100, status: 'completed' }
                  : item
              ));

              resolve({ success: true, file });
            } catch (error) {
              setUploadProgress(prev => prev.map(item => 
                item.fileName === fileName 
                  ? { ...item, status: 'error', error: (error as Error).message }
                  : item
              ));
              reject(error);
            }
          } else {
            const error = new Error('파일 업로드에 실패했습니다.');
            setUploadProgress(prev => prev.map(item => 
              item.fileName === fileName 
                ? { ...item, status: 'error', error: error.message }
                : item
            ));
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          const error = new Error('파일 업로드 중 오류가 발생했습니다.');
          setUploadProgress(prev => prev.map(item => 
            item.fileName === fileName 
              ? { ...item, status: 'error', error: error.message }
              : item
          ));
          reject(error);
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', fileType);
        xhr.send(file);
      });

    } catch (error) {
      setUploadProgress(prev => prev.map(item => 
        item.fileName === fileName 
          ? { ...item, status: 'error', error: (error as Error).message }
          : item
      ));
      return { success: false, error: (error as Error).message };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || isUploading) return;

    setIsUploading(true);
    const results: UploadResult[] = [];

    for (const file of acceptedFiles) {
      try {
        const result = await uploadFile(file);
        results.push(result);
        if (result.success) {
          onUploadComplete(result);
        }
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }

    setIsUploading(false);
  }, [requestId, onUploadComplete, disabled, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    disabled: disabled || isUploading,
    multiple: true
  });

  const removeProgressItem = (fileName: string) => {
    setUploadProgress(prev => prev.filter(item => item.fileName !== fileName));
  };

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
              ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? '파일을 여기에 놓아주세요' : '파일을 드래그하거나 클릭하여 업로드'}
            </div>
            <div className="text-sm text-gray-500">
              최대 {formatFileSize(maxSize)}까지 업로드 가능 (Supabase 무료 버전 제한)
            </div>
            <div className="text-xs text-gray-400 mt-2">
              지원 형식: {acceptedFileTypes.map(type => FILE_TYPE_LABELS[type as keyof typeof FILE_TYPE_LABELS]).join(', ')}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 업로드 진행 상황 */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">업로드 진행 상황</h4>
            <div className="space-y-3">
              {uploadProgress.map((item) => (
                <div key={item.fileName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.fileName}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            item.status === 'completed' ? 'bg-green-500' :
                            item.status === 'error' ? 'bg-red-500' : 'bg-primary'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {item.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    {item.status === 'uploading' && (
                      <Badge variant="secondary">{item.progress}%</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProgressItem(item.fileName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {item.error && (
                    <div className="text-xs text-red-500 mt-1">{item.error}</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
