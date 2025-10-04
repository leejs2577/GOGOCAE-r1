'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { Calendar, Upload, ArrowLeft, Home, File, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CreateRequestSchema, type CreateRequestData, RequestPriority, ANALYSIS_TYPES, UploadResult } from '@/domains/request/types';
import { REQUEST_PRIORITY_LABELS } from '@/domains/request/types';
import FileUpload from '@/components/file-upload/FileUpload';

export default function CreateRequestPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const { canCreateRequest } = useUserRole();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRequestData>({
    resolver: zodResolver(CreateRequestSchema),
    defaultValues: {
      priority: RequestPriority.MEDIUM,
    },
  });

  const priorityValue = watch('priority');

  const onSubmitRequest = async (data: CreateRequestData) => {
    if (!canCreateRequest) {
      alert('요청을 생성할 권한이 없습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. 요청 생성
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '요청 생성에 실패했습니다.');
      }

      const requestId = result.request.id;

      // 2. 업로드된 파일들을 순차적으로 업로드
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await uploadFileToRequest(requestId, file);
        }
      }

      alert('해석 요청이 성공적으로 생성되었습니다.');
      router.push('/requests');
    } catch (error) {
      console.error('Request creation error:', error);
      alert(error instanceof Error ? error.message : '요청 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileSelect(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/step': ['.step'],
      'application/iges': ['.iges'],
      'application/pdf': ['.pdf'],
      'application/x-pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    noClick: true // 클릭 이벤트는 별도 처리
  });

  const uploadFileToRequest = async (requestId: string, file: File) => {
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    try {
      // 1. 업로드 URL 생성
      const uploadUrlResponse = await fetch(`/api/requests/${requestId}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        })
      });

      console.log('Upload URL response status:', uploadUrlResponse.status);
      console.log('Upload URL response ok:', uploadUrlResponse.ok);

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        console.error('Upload URL error response text:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || '알 수 없는 오류가 발생했습니다.' };
        }
        
        console.error('Upload URL error:', error);
        throw new Error(error.error || '업로드 URL 생성에 실패했습니다.');
      }

      const { uploadUrl, path } = await uploadUrlResponse.json();
      console.log('Upload URL generated:', uploadUrl);
      console.log('Storage path:', path);

      // 2. 파일 업로드
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('File upload response status:', uploadResponse.status);
      console.log('File upload response ok:', uploadResponse.ok);

      if (!uploadResponse.ok) {
        const uploadErrorText = await uploadResponse.text();
        console.error('File upload error:', uploadErrorText);
        throw new Error(`파일 업로드에 실패했습니다: ${uploadResponse.status}`);
      }

      // 3. 메타데이터는 이미 /api/requests/${requestId}/files에서 저장되었으므로 추가 저장 불필요
      console.log('File upload completed successfully');
      const result = {
        success: true,
        file: {
          id: 'uploaded', // 임시 ID
          file_name: file.name,
          file_size: file.size,
          file_path: path
        }
      };
      console.log('File upload completed:', result);
      return result;
      
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };


  if (!canCreateRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
              <p className="text-gray-600 mb-4">
                요청을 생성할 권한이 없습니다.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                대시보드로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">새 해석 요청</h1>
          <p className="text-gray-600">CAE 해석 요청을 등록하세요</p>
        </div>

        {/* 통합 요청 생성 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>새 해석 요청</CardTitle>
            <CardDescription>
              해석 요청에 필요한 정보를 입력하고 파일을 업로드해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitRequest)} className="space-y-6">
              {/* 요청명 */}
              <div className="space-y-2">
                <Label htmlFor="title">요청명 *</Label>
                <Input
                  id="title"
                  placeholder="예: 차체 강도 해석 요청"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  placeholder="해석 요청에 대한 자세한 설명을 입력해주세요..."
                  rows={4}
                  {...register('description')}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* 차종 */}
              <div className="space-y-2">
                <Label htmlFor="car_model">차종 *</Label>
                <Input
                  id="car_model"
                  placeholder="예: 소형차, 중형차, SUV 등"
                  {...register('car_model')}
                  className={errors.car_model ? 'border-red-500' : ''}
                />
                {errors.car_model && (
                  <p className="text-sm text-red-500">{errors.car_model.message}</p>
                )}
              </div>

              {/* 해석 유형 */}
              <div className="space-y-2">
                <Label htmlFor="analysis_type">해석 유형 *</Label>
                <Select onValueChange={(value) => setValue('analysis_type', value)}>
                  <SelectTrigger className={errors.analysis_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="해석 유형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANALYSIS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.analysis_type && (
                  <p className="text-sm text-red-500">{errors.analysis_type.message}</p>
                )}
              </div>

              {/* 마감일 */}
              <div className="space-y-2">
                <Label htmlFor="requested_deadline">요청 마감일 *</Label>
                <div className="relative">
                  <Input
                    id="requested_deadline"
                    type="date"
                    {...register('requested_deadline')}
                    className={errors.requested_deadline ? 'border-red-500' : ''}
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.requested_deadline && (
                  <p className="text-sm text-red-500">{errors.requested_deadline.message}</p>
                )}
              </div>

              {/* 우선순위 */}
              <div className="space-y-2">
                <Label htmlFor="priority">우선순위</Label>
                <Select value={priorityValue} onValueChange={(value) => setValue('priority', value as RequestPriority)}>
                  <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                    <SelectValue placeholder="우선순위를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RequestPriority.LOW}>
                      {REQUEST_PRIORITY_LABELS[RequestPriority.LOW]}
                    </SelectItem>
                    <SelectItem value={RequestPriority.MEDIUM}>
                      {REQUEST_PRIORITY_LABELS[RequestPriority.MEDIUM]}
                    </SelectItem>
                    <SelectItem value={RequestPriority.HIGH}>
                      {REQUEST_PRIORITY_LABELS[RequestPriority.HIGH]}
                    </SelectItem>
                    <SelectItem value={RequestPriority.URGENT}>
                      {REQUEST_PRIORITY_LABELS[RequestPriority.URGENT]}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-500">{errors.priority.message}</p>
                )}
              </div>

              {/* 파일 업로드 섹션 */}
              <div className="space-y-4 pt-6 border-t">
                <div className="space-y-2">
                  <Label>파일 업로드 (선택사항)</Label>
                  <div className="text-sm text-gray-500">
                    해석에 필요한 모델 파일을 업로드해주세요
                  </div>
                </div>

                {/* 파일 선택 영역 */}
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}
                  `}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.step,.iges,.pdf,.png,.jpg,.jpeg,.gif';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      handleFileSelect(files);
                    };
                    input.click();
                  }}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? '파일을 여기에 놓아주세요' : '파일을 드래그하거나 클릭하여 선택'}
                  </div>
                  <div className="text-sm text-gray-500">
                    최대 50MB까지 업로드 가능 (Supabase 무료 버전 제한)
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    지원 형식: STEP, IGES, PDF, PNG, JPEG, GIF
                  </div>
                </div>

                {/* 선택된 파일 목록 */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">선택된 파일 ({uploadedFiles.length}개)</h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <File className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '생성 중...' : '해석 요청'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
