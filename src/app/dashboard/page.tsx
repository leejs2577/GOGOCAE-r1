'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Plus, Users, FileText, Calendar, Kanban } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { USER_ROLE_LABELS } from '@/domains/auth/constants';
import { DesignerOnly, AnalystOnly, AdminOnly, DesignerAndAdmin, AnalystAndAdmin } from '@/components/auth/RoleGuard';
import { RequestStatus, type Request } from '@/domains/request/types';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import CalendarView from '@/components/calendar/CalendarView';
import { getRequests } from '@/domains/request/services/requestService';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { role, canCreateRequest, canAssignRequest, canManageUsers } = useUserRole();
  const router = useRouter();
  
  // 통계 데이터 상태
  const [requests, setRequests] = useState<Request[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // 로딩이 완료되고 사용자가 없을 때만 리다이렉트
    if (!isLoading && !user) {
      console.log('Dashboard: No user found, redirecting to login');
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // 요청 데이터 가져오기
  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      
      try {
        setStatsLoading(true);
        const { requests, error } = await getRequests();
        
        if (error) {
          console.error('Failed to fetch requests:', error);
        } else {
          setRequests(requests || []);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // 통계 데이터 가져오기
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        
        if (statsResponse.ok) {
          setDashboardStats(statsData.stats);
        }

        // 활동 데이터 가져오기
        const activitiesResponse = await fetch('/api/dashboard/activities');
        const activitiesData = await activitiesResponse.json();
        
        if (activitiesResponse.ok) {
          setActivities(activitiesData.activities || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (user) {
      fetchRequests();
      fetchDashboardData();
      
      // 30초마다 데이터 새로고침 (실시간 업데이트)
      const interval = setInterval(() => {
        fetchRequests();
        fetchDashboardData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  // 통계 계산
  const getStats = () => {
    if (!user) return { total: 0, inProgress: 0, completed: 0, myTasks: 0 };

    const total = requests.length;
    const inProgress = requests.filter(req => req.status === RequestStatus.IN_PROGRESS).length;
    const completed = requests.filter(req => req.status === RequestStatus.COMPLETED).length;
    
    // 사용자 역할에 따른 "내 작업" 계산
    let myTasks = 0;
    if (role === 'designer') {
      // 설계자는 자신이 생성한 요청
      myTasks = requests.filter(req => req.requester_id === user.id).length;
    } else if (role === 'analyst') {
      // 해석자는 자신에게 할당된 요청
      myTasks = requests.filter(req => req.assignee_id === user.id).length;
    } else if (role === 'admin') {
      // 관리자는 모든 요청
      myTasks = total;
    }

    return { total, inProgress, completed, myTasks };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">고고CAE</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user.email}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS]}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
          <p className="text-gray-600">
            {role === 'designer' && '해석 요청을 등록하고 진행 상황을 확인하세요'}
            {role === 'analyst' && '담당된 해석 요청을 효율적으로 관리하세요'}
            {role === 'admin' && '전체 시스템을 관리하고 모니터링하세요'}
            {!role && 'CAE 해석 업무를 효율적으로 관리하세요'}
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미지정 요청</CardTitle>
              <div className="h-4 w-4 text-red-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (dashboardStats?.pendingRequests || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.pendingRequests === 0 ? '모든 요청이 처리되었습니다' : '담당자 지정 대기'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">진행 중</CardTitle>
              <div className="h-4 w-4 text-yellow-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (dashboardStats?.inProgressRequests || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.inProgressRequests === 0 ? '진행 중인 작업이 없습니다' : '진행 중인 작업'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료</CardTitle>
              <div className="h-4 w-4 text-green-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (dashboardStats?.completedRequests || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.completedRequests === 0 ? '완료된 작업이 없습니다' : '완료된 작업'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평균 리드타임</CardTitle>
              <div className="h-4 w-4 text-blue-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : `${dashboardStats?.averageLeadTime || 0}일`}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.averageLeadTime === 0 ? '완료된 요청이 없습니다' : '평균 처리 시간'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KPI 메트릭 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">완료율</CardTitle>
              <div className="h-4 w-4 text-purple-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : `${dashboardStats?.completionRate || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                전체 요청 대비 완료율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 작업</CardTitle>
              <div className="h-4 w-4 text-indigo-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (dashboardStats?.myTasks || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {role === 'designer' ? '내가 생성한 요청' :
                 role === 'analyst' ? '내가 담당한 요청' :
                 role === 'admin' ? '전체 요청' : '내 작업'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 요청</CardTitle>
              <div className="h-4 w-4 text-gray-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : (dashboardStats?.totalRequests || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboardStats?.totalRequests === 0 ? '아직 등록된 요청이 없습니다' : '총 요청 수'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 대시보드 탭 */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="kanban">칸반 보드</TabsTrigger>
            <TabsTrigger value="calendar">캘린더</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    빠른 작업
                  </CardTitle>
                  <CardDescription>
                    자주 사용하는 기능에 빠르게 접근하세요
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DesignerAndAdmin>
                    <Button 
                      className="w-full justify-start" 
                      onClick={() => router.push('/requests/create')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      새 해석 요청 생성
                    </Button>
                  </DesignerAndAdmin>
                  
                  <AnalystAndAdmin>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => router.push('/requests')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      담당 요청 관리
                    </Button>
                  </AnalystAndAdmin>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/requests')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    요청 목록 보기
                  </Button>
                  
                  <AdminOnly>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <Users className="mr-2 h-4 w-4" />
                      사용자 관리
                    </Button>
                  </AdminOnly>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>최근 활동</CardTitle>
                  <CardDescription>
                    최근 작업 내역을 확인하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500">아직 활동 내역이 없습니다</p>
                      <p className="text-sm text-gray-400 mt-1">
                        첫 번째 해석 요청을 생성해보세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            {activity.type === 'request_created' && (
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <Plus className="w-4 h-4 text-blue-600" />
                              </div>
                            )}
                            {activity.type === 'request_assigned' && (
                              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-yellow-600" />
                              </div>
                            )}
                            {activity.type === 'request_updated' && (
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-orange-600" />
                              </div>
                            )}
                            {activity.type === 'request_completed' && (
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <FileText className="w-4 h-4 text-green-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-gray-500">
                                {activity.user_name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(activity.timestamp).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 칸반 보드 탭 */}
          <TabsContent value="kanban">
            <KanbanBoard 
              requests={requests}
              onStatusChange={(requestId, newStatus) => {
                setRequests(prev => 
                  prev.map(req => 
                    req.id === requestId 
                      ? { ...req, status: newStatus }
                      : req
                  )
                );
              }}
              onCardClick={(request) => {
                router.push(`/requests/${request.id}`);
              }}
            />
          </TabsContent>

          {/* 캘린더 탭 */}
          <TabsContent value="calendar">
            <CalendarView 
              requests={requests}
              onEventClick={(event) => {
                router.push(`/requests/${event.id}`);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
