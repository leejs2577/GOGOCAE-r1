'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, Search, Edit, UserCheck, Home } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { UpdateProfileSchema, type UpdateProfileData, UserRole } from '@/domains/auth/types';

// 관리자용 프로필 업데이트 스키마
const AdminUpdateProfileSchema = UpdateProfileSchema.extend({
  role: z.nativeEnum(UserRole),
});

type AdminUpdateProfileData = z.infer<typeof AdminUpdateProfileSchema>;
import { USER_ROLE_LABELS } from '@/domains/auth/constants';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<AdminUpdateProfileData>({
    resolver: zodResolver(AdminUpdateProfileSchema),
    defaultValues: {
      role: UserRole.DESIGNER,
    },
  });

  const roleValue = watch('role');

  // 사용자 목록 조회
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const response = await fetch('/api/admin/users', {
          credentials: 'include',
        });
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Fetched data:', data);
          console.log('Users array:', data.users);
          setUsers(data.users || []);
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditUser = (user: UserProfile) => {
    console.log('Editing user:', user);
    setSelectedUser(user);
    reset({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role as UserRole,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: AdminUpdateProfileData) => {
    if (!selectedUser) {
      console.error('No selected user');
      return;
    }

    console.log('Submitting form data:', data);
    console.log('Selected user ID:', selectedUser.id);

    try {
      setIsLoading(true);
      console.log('Sending PUT request to:', `/api/admin/users/${selectedUser.id}`);

      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || '사용자 정보 업데이트에 실패했습니다.');
      }

      const responseData = await response.json();
      console.log('Update successful:', responseData);

      // 사용자 목록 새로고침
      console.log('Refreshing user list...');
      const usersResponse = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Refreshed users:', usersData);
        setUsers(usersData.users || []);
      }

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      alert('사용자 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('User update error:', error);
      alert(error instanceof Error ? error.message : '사용자 정보 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'designer':
        return 'bg-blue-100 text-blue-700';
      case 'analyst':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 관리자 권한 확인 - Hook 호출 이후에 위치
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
              <p className="text-gray-600 mb-4">
                이 페이지는 관리자만 접근할 수 있습니다.
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* 홈 아이콘 - 대시보드로 이동 */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none"
                title="대시보드로 이동"
              >
                <Home className="h-6 w-6" />
              </Button>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
                <p className="text-gray-600">전체 사용자 정보를 관리하세요</p>
              </div>
            </div>
          </div>
        </div>

        {/* 검색 및 통계 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="이메일 또는 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">전체: {users.length}명</span>
              <span>설계자: {users.filter(u => u.role === 'designer').length}명</span>
              <span>해석자: {users.filter(u => u.role === 'analyst').length}명</span>
              <span>관리자: {users.filter(u => u.role === 'admin').length}명</span>
            </div>
          </div>
        </div>

        {/* 사용자 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>
              등록된 모든 사용자의 정보를 확인하고 관리할 수 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">이메일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">역할</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">가입일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="font-medium">
                            {user.full_name || '정보 없음'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role === 'designer' ? '설계자' :
                           user.role === 'analyst' ? '해석자' :
                           user.role === 'admin' ? '관리자' : user.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                {users.length === 0 ? (
                  <div>
                    <p className="text-gray-500 mb-2">등록된 사용자가 없습니다</p>
                    <p className="text-sm text-gray-400">
                      데이터베이스에서 사용자 정보를 찾을 수 없습니다.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">검색 결과가 없습니다</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 사용자 수정 다이얼로그 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>사용자 정보 수정</DialogTitle>
              <DialogDescription>
                {selectedUser?.full_name || selectedUser?.email}님의 정보를 수정하세요
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

              <div className="space-y-2">
                <Label htmlFor="role">역할</Label>
                <Select value={roleValue} onValueChange={(value) => setValue('role', value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.DESIGNER}>
                      {USER_ROLE_LABELS.designer}
                    </SelectItem>
                    <SelectItem value={UserRole.ANALYST}>
                      {USER_ROLE_LABELS.analyst}
                    </SelectItem>
                    <SelectItem value={UserRole.ADMIN}>
                      {USER_ROLE_LABELS.admin}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
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
