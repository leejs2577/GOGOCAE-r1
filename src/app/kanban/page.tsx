'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { USER_ROLE_LABELS } from '@/domains/auth/constants';
import { DesignerAndAdmin } from '@/components/auth/RoleGuard';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import { Request } from '@/domains/request/types';

export default function KanbanPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/requests');
        const data = await response.json();

        if (response.ok) {
          setRequests(data.requests || []);
        } else {
          console.error('Failed to fetch requests:', data.error);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, status: newStatus as any }
          : request
      )
    );
  };

  const handleCardClick = (request: Request) => {
    router.push(`/requests/${request.id}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 ml-64">
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user?.role === 'designer' ? '내 요청 Kanban 보드' : 
                   user?.role === 'analyst' ? '담당 프로젝트 Kanban 보드' : 
                   '전체 Kanban 보드'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.role === 'designer' ? '내가 요청한 프로젝트의 진행 상황을 확인하세요 (상태 변경 불가)' : 
                   user?.role === 'analyst' ? '담당 프로젝트의 진행 상황을 관리하세요' : 
                   '드래그 앤 드롭으로 작업 상태를 관리하세요'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <NotificationBell />
                <DesignerAndAdmin>
                  <Button onClick={() => router.push('/requests/create')} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    신규 해석 요청
                  </Button>
                </DesignerAndAdmin>
                <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">
                      {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS]}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 검색 및 필터 바 */}
            <div className="flex items-center space-x-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="노트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  모든 계정과목
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <Button variant="outline" size="sm">
                  모든 담당자
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
                <span className="text-sm text-gray-600">총 {requests.length}개 노트</span>
              </div>
            </div>
          </div>
        </header>

        {/* 칸반 보드 */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            </div>
          ) : (
            <KanbanBoard
              requests={requests}
              onStatusChange={handleStatusChange}
              onCardClick={handleCardClick}
              userRole={role}
            />
          )}
        </div>
      </main>
    </div>
  );
}
