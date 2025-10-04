'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, File, X, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// 스키마 정의
const ReportUploadSchema = z.object({
  specialNotes: z.string().min(1, '특이사항을 입력해주세요').max(2000, '특이사항은 2000자 이하로 입력해주세요'),
});

type ReportUploadData = z.infer<typeof ReportUploadSchema>;

interface ReportUploadFormProps {
  requestId: string;
  onUploadComplete: () => void;
}

export default function ReportUploadForm({ requestId, onUploadComplete }: ReportUploadFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReportUploadData>({
    resolver: zodResolver(ReportUploadSchema),
  });

  // 파일 드롭 핸들러
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xls'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
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

  // 파일 확장자별 MIME 타입 매핑
  const getFileTypeFromExtension = (fileName: string): string => {
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
  };

  // 파일 업로드
  const uploadFile = async (file: File, requestId: string): Promise<string> => {
    console.log('Uploading file:', file.name, 'to request:', requestId);
    
    // 파일 타입 결정 (file.type이 비어있으면 확장자 기반으로 결정)
    const fileType = file.type || getFileTypeFromExtension(file.name);
    console.log('File type determined:', { originalType: file.type, determinedType: fileType });
    
    // 1. 서버에 업로드 URL 요청
    const uploadUrlResponse = await fetch(`/api/requests/${requestId}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: fileType,
        fileSize: file.size,
        fileType: fileType,
        metadata: {
          type: 'report',
          uploadedAt: new Date().toISOString(),
        },
      }),
    });

    if (!uploadUrlResponse.ok) {
      const errorText = await uploadUrlResponse.text();
      console.error('Upload URL error response text:', errorText);
      throw new Error(`업로드 URL 생성 실패: ${uploadUrlResponse.status}`);
    }

    const uploadData = await uploadUrlResponse.json();
    console.log('Upload URL response:', uploadData);

    if (!uploadData.signedUrl) {
      throw new Error('업로드 URL이 제공되지 않았습니다.');
    }

    // 2. Supabase Storage에 파일 업로드
    console.log('Uploading to Supabase Storage:', {
      url: uploadData.signedUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: fileType,
      path: uploadData.path
    });
    
    const uploadResponse = await fetch(uploadData.signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': fileType,
      },
    });

    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response ok:', uploadResponse.ok);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error response:', errorText);
      throw new Error(`파일 업로드 실패: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('File uploaded successfully to:', uploadData.path);
    return uploadData.fileId;
  };

  // 폼 제출
  const onSubmit = async (data: ReportUploadData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "파일이 필요합니다",
        description: "보고서 파일을 최소 1개 이상 업로드해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const uploadResults: string[] = [];

    try {
      // 각 파일을 순차적으로 업로드
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // 업로드 진행률 업데이트
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0,
        }));

        try {
          const fileId = await uploadFile(file, requestId);
          uploadResults.push(fileId);
          
          // 업로드 완료 표시
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100,
          }));

          console.log(`File ${file.name} uploaded successfully with ID: ${fileId}`);
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error);
          toast({
            title: "파일 업로드 실패",
            description: `${file.name} 업로드에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
            variant: "destructive",
          });
          throw error;
        }
      }

      // 특이사항을 메타데이터로 저장 (첫 번째 파일에 추가)
      if (uploadResults.length > 0 && data.specialNotes) {
        try {
          await fetch(`/api/requests/${requestId}/files/${uploadResults[0]}/metadata`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              specialNotes: data.specialNotes,
            }),
          });
        } catch (error) {
          console.error('Failed to save special notes:', error);
          // 특이사항 저장 실패는 전체 업로드를 실패로 처리하지 않음
        }
      }

      toast({
        title: "보고서 업로드 완료",
        description: `${selectedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`,
      });

      // 폼 초기화
      reset();
      setSelectedFiles([]);
      setUploadProgress({});
      
      // 완료 콜백 호출
      onUploadComplete();

    } catch (error) {
      console.error('Report upload error:', error);
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 특이사항 입력 */}
      <div className="space-y-2">
        <Label htmlFor="specialNotes">특이사항 *</Label>
        <Textarea
          id="specialNotes"
          placeholder="해석 결과에 대한 특이사항이나 추가 설명을 입력해주세요..."
          rows={4}
          {...register('specialNotes')}
          className={errors.specialNotes ? 'border-red-500' : ''}
        />
        {errors.specialNotes && (
          <p className="text-sm text-red-500">{errors.specialNotes.message}</p>
        )}
      </div>

      {/* 파일 업로드 영역 */}
      <div className="space-y-2">
        <Label>보고서 파일 *</Label>
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-primary font-medium">파일을 여기에 놓으세요...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    파일을 드래그하거나 클릭하여 업로드하세요
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, DOC, DOCX, XLS, XLSX, TXT, PPT, PPTX, STEP, IGES 파일 (최대 50MB)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 선택된 파일 목록 */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>선택된 파일 ({selectedFiles.length}개)</Label>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {uploadProgress[file.name] !== undefined && (
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] === 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
                
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
        >
          취소
        </Button>
        <Button
          type="submit"
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? '업로드 중...' : '보고서 업로드'}
        </Button>
      </div>
    </form>
  );
}