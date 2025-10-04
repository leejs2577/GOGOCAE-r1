'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, ArrowLeft, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { CreateRequestSchema, type CreateRequestData, RequestPriority, ANALYSIS_TYPES } from '@/domains/request/types';
import { REQUEST_PRIORITY_LABELS } from '@/domains/request/types';

interface EditRequestPageProps {
  params: Promise<{ id: string }>;
}

export default function EditRequestPage({ params }: EditRequestPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [requestId, setRequestId] = useState<string>('');
  const { user } = useAuth();
  const { canViewAllRequests } = useUserRole();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRequestData>({
    resolver: zodResolver(CreateRequestSchema),
  });

  const priorityValue = watch('priority');

  useEffect(() => {
    const loadParams = async () => {
      const { id } = await params;
      setRequestId(id);
      
      // 요청 데이터 로드
      try {
        const response = await fetch(`/api/requests/${id}`);
        if (!response.ok) {
          throw new Error('요청을 찾을 수 없습니다.');
        }
        
        const result = await response.json();
        const request = result.request;
        
        // 권한 확인
        if (!canViewAllRequests && request.requester_id !== user?.id) {
          alert('수정할 권한이 없습니다.');
          router.push('/requests');
          return;
        }
        
        // 폼 데이터 설정
        setValue('title', request.title);
        setValue('description', request.description);
        setValue('car_model', request.car_model);
        setValue('analysis_type', request.analysis_type);
        setValue('priority', request.priority);
        setValue('requested_deadline', request.requested_deadline.split('T')[0]); // YYYY-MM-DD 형식으로 변환
        
        setIsLoading(false);
      } catch (error) {
        console.error('Request load error:', error);
        alert(error instanceof Error ? error.message : '요청을 불러오는 중 오류가 발생했습니다.');
        router.push('/requests');
      }
    };
    
    loadParams();
  }, [params, setValue, canViewAllRequests, user?.id, router]);

  const onSubmit = async (data: CreateRequestData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '요청 수정에 실패했습니다.');
      }

      alert('요청이 성공적으로 수정되었습니다.');
      router.push('/requests');
    } catch (error) {
      console.error('Request update error:', error);
      alert(error instanceof Error ? error.message : '요청 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">요청 정보를 불러오는 중...</p>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">요청 수정</h1>
          <p className="text-gray-600">해석 요청 정보를 수정하세요</p>
        </div>

        {/* 요청 수정 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>요청 정보</CardTitle>
            <CardDescription>
              수정할 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  {isSubmitting ? '수정 중...' : '수정 완료'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

