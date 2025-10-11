'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, Plus, Calendar, User, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { USER_ROLE_LABELS } from '@/domains/auth/constants';
import { DesignerAndAdmin } from '@/components/auth/RoleGuard';
import CalendarView from '@/components/calendar/CalendarView';
import { Request } from '@/domains/request/types';

export default function CalendarPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Request | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { user } = useAuth();
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: Request) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'assigned': return '지정됨';
      case 'pending': return '대기';
      case 'cancelled': return '취소됨';
      default: return status;
    }
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
                  {user?.role === 'designer' ? '내 요청 캘린더' : 
                   user?.role === 'analyst' ? '담당 프로젝트 캘린더' : 
                   '전체 캘린더'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.role === 'designer' ? '내가 요청한 프로젝트의 일정을 확인하세요' : 
                   user?.role === 'analyst' ? '담당 프로젝트의 일정을 확인하세요' : 
                   '일정별로 프로젝트를 관리하세요'}
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

            {/* 캘린더 컨트롤 */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                  >
                    오늘
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="노트 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  모든 계정과목
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* 캘린더 뷰 */}
        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            </div>
          ) : (
            <CalendarView
              requests={requests}
              currentDate={currentDate}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </main>

      {/* 이벤트 상세 정보 모달 */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              프로젝트 상세 정보
            </DialogTitle>
            <DialogDescription>
              캘린더에서 선택한 프로젝트의 상세 정보를 확인하세요.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedEvent.title}</span>
                    <Badge className={getStatusColor(selectedEvent.status)}>
                      {getStatusLabel(selectedEvent.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{selectedEvent.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">해석 유형:</span>
                      <span className="text-sm font-medium">{selectedEvent.analysis_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">차종:</span>
                      <span className="text-sm font-medium">{selectedEvent.car_model}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 일정 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    일정 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">요청일:</span>
                    <span className="text-sm font-medium">{formatDate(selectedEvent.created_at)}</span>
                  </div>
                  {selectedEvent.requested_deadline && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">마감일:</span>
                      <span className="text-sm font-medium text-red-600">
                        {formatDate(selectedEvent.requested_deadline)}
                      </span>
                    </div>
                  )}
                  {selectedEvent.updated_at && selectedEvent.updated_at !== selectedEvent.created_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">마지막 업데이트:</span>
                      <span className="text-sm font-medium">{formatDate(selectedEvent.updated_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 담당자 정보 */}
              {(selectedEvent.assignee || selectedEvent.requester) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      담당자 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedEvent.requester && (
                      <div>
                        <span className="text-sm text-gray-600">요청자:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {selectedEvent.requester.full_name || selectedEvent.requester.email}
                            </p>
                            <p className="text-xs text-gray-500">{selectedEvent.requester.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedEvent.assignee && (
                      <div>
                        <span className="text-sm text-gray-600">담당자:</span>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {selectedEvent.assignee.full_name || selectedEvent.assignee.email}
                            </p>
                            <p className="text-xs text-gray-500">{selectedEvent.assignee.email}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEventModalOpen(false)}
                >
                  닫기
                </Button>
                <Button
                  onClick={() => {
                    setIsEventModalOpen(false);
                    router.push(`/requests/${selectedEvent.id}`);
                  }}
                >
                  상세 보기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
