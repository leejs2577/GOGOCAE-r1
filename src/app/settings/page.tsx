'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings as SettingsIcon, User, Mail, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { UpdateProfileSchema, type UpdateProfileData } from '@/domains/auth/types';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { role } = useUserRole();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileData>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.full_name || '',
    },
  });

  // 사용자 정보가 변경되면 폼 업데이트
  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        full_name: user.full_name || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileData) => {
    console.log('Profile update form submitted with data:', data);

    try {
      setIsLoading(true);

      console.log('Sending PUT request to /api/user/profile');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // 쿠키 포함
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(responseData.error || '프로필 업데이트에 실패했습니다.');
      }

      console.log('Profile update successful:', responseData);

      // 성공 메시지 표시
      toast({
        title: '프로필 업데이트 완료',
        description: '프로필이 성공적으로 업데이트되었습니다.',
        variant: 'default',
      });

      setSuccess(true);
      setIsOpen(false);

      // 사용자 정보 새로고침 (페이지 전체 새로고침 대신)
      console.log('Calling refreshUser to update UI...');
      const refreshed = await refreshUser();

      if (refreshed) {
        console.log('User data refreshed successfully');
      } else {
        console.warn('User data refresh failed, falling back to page reload');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error instanceof Error ? error.message : '프로필 업데이트에 실패했습니다.';

      toast({
        title: '프로필 업데이트 실패',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    setSuccess(false);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setSuccess(false);
    reset(); // 폼 초기화
  };

  const handleDebugProfile = async () => {
    try {
      console.log('Running profile debug...');
      const response = await fetch('/api/debug/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile debug result:', data);

        toast({
          title: '디버그 정보',
          description: `인증: ${data.debug.authenticated ? '✓' : '✗'} | 프로필: ${data.debug.profileExists ? '✓' : '✗'}`,
          variant: 'default',
        });
      } else {
        const errorData = await response.json();
        console.error('Debug error:', errorData);

        toast({
          title: '디버그 실패',
          description: '디버그 정보를 가져오는데 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Debug error:', error);

      toast({
        title: '디버그 오류',
        description: '디버그 실행 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">설정</h1>
              <p className="text-gray-600">계정 정보를 관리하세요</p>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                onClick={handleDebugProfile}
                className="flex items-center gap-2"
              >
                <SettingsIcon className="h-4 w-4" />
                디버그
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 설정 카드 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  프로필 정보
                </CardTitle>
                <CardDescription>
                  기본 정보를 확인하고 수정할 수 있습니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">이메일</Label>
                    <p className="mt-1 text-gray-900">{user?.email || '정보 없음'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">이름</Label>
                    <p className="mt-1 text-gray-900">{user?.full_name || '정보 없음'}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">역할</Label>
                  <p className="mt-1 text-gray-900">
                    {role === 'designer' ? '설계자' : 
                     role === 'analyst' ? '해석자' : 
                     role === 'admin' ? '관리자' : '알 수 없음'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">가입일</Label>
                  <p className="mt-1 text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '정보 없음'}
                  </p>
                </div>

                <Button onClick={handleOpenDialog} className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  프로필 수정
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 정보 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">계정 보안</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">비밀번호</p>
                    <p className="text-sm text-gray-500">마지막 변경: 정보 없음</p>
                  </div>
                  <Button variant="outline" size="sm">
                    변경
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">알림 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">이메일 알림</p>
                    <p className="text-sm text-gray-500">중요한 업데이트 알림</p>
                  </div>
                  <Button variant="outline" size="sm">
                    설정
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 프로필 수정 다이얼로그 */}
        <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>프로필 수정</DialogTitle>
              <DialogDescription>
                기본 정보를 수정하세요. 변경사항은 즉시 적용됩니다.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">이름</Label>
                <Input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500">{errors.full_name.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !isDirty}
                >
                  {isLoading ? '저장 중...' : '변경 완료'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
