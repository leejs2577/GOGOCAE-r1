'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, TrendingDown, Users, FileText, Clock, CheckCircle, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { USER_ROLE_LABELS } from '@/domains/auth/constants';
import { DesignerAndAdmin } from '@/components/auth/RoleGuard';
import { type Request } from '@/domains/request/types';
import { getRequests } from '@/domains/request/services/requestService';

interface Activity {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_updated' | 'request_completed';
  title: string;
  description: string;
  user_name: string;
  timestamp: string;
  tag?: string;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { role } = useUserRole();
  const router = useRouter();

  const [requests, setRequests] = useState<Request[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

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
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();

        if (statsResponse.ok) {
          setDashboardStats(statsData.stats);
        }

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

      const interval = setInterval(() => {
        fetchRequests();
        fetchDashboardData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">대시보드를 불러오는 중...</p>
          <p className="mt-2 text-sm text-gray-500">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
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
                <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
                <p className="text-sm text-gray-600 mt-1">오늘의 업무 현황을 한눈에 확인하세요</p>
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
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="p-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* 역할별 첫 번째 카드 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {role === 'designer' ? '내 요청' : role === 'analyst' ? '내 담당' : '전체 요청'}
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-gray-900">
                    {statsLoading ? '...' : (dashboardStats?.myTasks || 0)}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+12% 지난 달 대비</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 진행 중 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">진행 중</CardTitle>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-gray-900">
                    {statsLoading ? '...' : (dashboardStats?.inProgressRequests || 0)}
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+5% 지난 달 대비</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 마감일 지남 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">마감일 지남</CardTitle>
                <div className="p-2 bg-red-50 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-bold text-gray-900">
                    {statsLoading ? '...' : (dashboardStats?.overdueRequests || 0)}
                  </div>
                  <div className="flex items-center text-sm text-red-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span>+2 지난 달 대비</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 완료율 */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">완료율</CardTitle>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold text-gray-900">
                      {statsLoading ? '...' : `${dashboardStats?.completionRate || 0}%`}
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>+8% 지난 달 대비</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">완료수</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {statsLoading ? '...' : (dashboardStats?.completedRequests || 0)}건
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 해석 프로젝트 진행현황 */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                {role === 'designer' ? '내 해석 프로젝트 진행현황' : 
                 role === 'analyst' ? '담당 프로젝트 진행현황' : 
                 '해석 프로젝트 진행현황'}
              </CardTitle>
              <CardDescription>
                {role === 'designer' ? '내가 요청한 프로젝트의 상태별 분포' : 
                 role === 'analyst' ? '담당 프로젝트의 상태별 분포' : 
                 '전체 프로젝트의 상태별 분포'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 담당자 미지정 */}
                <div className="flex items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">담당자 미지정</span>
                  </div>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gray-500 h-full rounded-full transition-all"
                        style={{ width: `${((dashboardStats?.pendingRequests || 0) / (dashboardStats?.totalRequests || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {dashboardStats?.pendingRequests || 0}
                    </span>
                  </div>
                </div>

                {/* 시작전 */}
                <div className="flex items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">시작전</span>
                  </div>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${((dashboardStats?.assignedRequests || 0) / (dashboardStats?.totalRequests || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {dashboardStats?.assignedRequests || 0}
                    </span>
                  </div>
                </div>

                {/* 진행중 */}
                <div className="flex items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">진행중</span>
                  </div>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${((dashboardStats?.inProgressRequests || 0) / (dashboardStats?.totalRequests || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {dashboardStats?.inProgressRequests || 0}
                    </span>
                  </div>
                </div>

                {/* 완료 */}
                <div className="flex items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">완료</span>
                  </div>
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${((dashboardStats?.completedRequests || 0) / (dashboardStats?.totalRequests || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                      {dashboardStats?.completedRequests || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 빠른 작업 & 최근 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 빠른 작업 */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle>빠른 작업</CardTitle>
                    <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {role === 'designer' && (
                    <>
                      <Button
                        onClick={() => router.push('/requests/create')}
                        className="w-full justify-start h-12 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        신규 해석 요청
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/requests')}
                        className="w-full justify-start h-12"
                      >
                        <FileText className="h-5 w-5 mr-3" />
                        요청 목록 보기
                      </Button>
                    </>
                  )}
                  
                  {role === 'analyst' && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/requests')}
                        className="w-full justify-start h-12"
                      >
                        <Eye className="h-5 w-5 mr-3" />
                        해석 목록 확인
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/requests?filter=assigned')}
                        className="w-full justify-start h-12"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        담당 해석 프로젝트
                      </Button>
                    </>
                  )}
                  
                  {role === 'admin' && (
                    <>
                      <Button
                        onClick={() => router.push('/requests/create')}
                        className="w-full justify-start h-12 bg-gray-900 hover:bg-gray-800 text-white"
                      >
                        <Plus className="h-5 w-5 mr-3" />
                        신규 해석 요청
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/requests')}
                        className="w-full justify-start h-12"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        담당 요청 관리
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/requests')}
                        className="w-full justify-start h-12"
                      >
                        <FileText className="h-5 w-5 mr-3" />
                        요청 목록 보기
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/users')}
                        className="w-full justify-start h-12"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        사용자 관리
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 최근 활동 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>최근 활동</CardTitle>
                  <CardDescription>최근 작업 이력을 확인하세요</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowActivityModal(true)}
                >
                  전체보기 →
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'request_created' ? 'bg-yellow-100' :
                          activity.type === 'request_assigned' ? 'bg-blue-100' :
                          activity.type === 'request_updated' ? 'bg-orange-100' :
                          'bg-green-100'
                        }`}>
                          {activity.type === 'request_created' && (
                            <FileText className="h-4 w-4 text-yellow-600" />
                          )}
                          {activity.type === 'request_assigned' && (
                            <Users className="h-4 w-4 text-blue-600" />
                          )}
                          {activity.type === 'request_updated' && (
                            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          {activity.type === 'request_completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {activity.type === 'request_created' && '새 요청이 생성되었습니다'}
                            {activity.type === 'request_assigned' && '담당자가 지정되었습니다'}
                            {activity.type === 'request_updated' && '작업이 진행 중입니다'}
                            {activity.type === 'request_completed' && '작업이 완료되었습니다'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {activity.description}
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
                  ))}

                  {activities.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-2">
                        <Users className="mx-auto h-12 w-12" />
                      </div>
                      <p className="text-gray-500">아직 활동 내역이 없습니다</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 최근 활동 모달 */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>최근 활동</DialogTitle>
            <DialogDescription>최근 20개의 작업 이력을 확인하세요</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {activities.slice(0, 20).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'request_created' ? 'bg-yellow-100' :
                      activity.type === 'request_assigned' ? 'bg-blue-100' :
                      activity.type === 'request_updated' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      {activity.type === 'request_created' && (
                        <FileText className="h-4 w-4 text-yellow-600" />
                      )}
                      {activity.type === 'request_assigned' && (
                        <Users className="h-4 w-4 text-blue-600" />
                      )}
                      {activity.type === 'request_updated' && (
                        <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      {activity.type === 'request_completed' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {activity.type === 'request_created' && '새 요청이 생성되었습니다'}
                        {activity.type === 'request_assigned' && '담당자가 지정되었습니다'}
                        {activity.type === 'request_updated' && '작업이 진행 중입니다'}
                        {activity.type === 'request_completed' && '작업이 완료되었습니다'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {activity.description}
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
              ))}

              {activities.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <Users className="mx-auto h-12 w-12" />
                  </div>
                  <p className="text-gray-500">아직 활동 내역이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
