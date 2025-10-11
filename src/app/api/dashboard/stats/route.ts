import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdmin } from '@/lib/supabase/server';
import { RequestStatus } from '@/domains/request/types';

export const runtime = 'nodejs';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  overdueRequests: number; // 마감일 지남 요청 수
  averageLeadTime: number;
  completionRate: number;
  myTasks: number;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 역할 확인 (안전하게)
    const { getUserProfile } = await import('@/lib/supabase/utils');
    const profile = await getUserProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: '사용자 프로필을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userRole = profile.role;

    let query = supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    // 역할별 필터링
    switch (userRole) {
      case 'designer':
        // 설계자: 자신이 요청한 프로젝트만
        query = query.eq('requester_id', user.id);
        break;
      case 'analyst':
        // 해석자: 담당자 미지정 프로젝트 + 자신이 담당하는 프로젝트
        query = query.or(`assignee_id.is.null,assignee_id.eq.${user.id}`);
        break;
      case 'admin':
        // 관리자: 모든 프로젝트
        break;
      default:
        // 기본적으로 설계자 권한으로 처리
        query = query.eq('requester_id', user.id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Failed to fetch requests:', error);
      return NextResponse.json(
        { error: '요청 데이터를 가져오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 통계 계산
    const totalRequests = requests?.length || 0;
    const pendingRequests = requests?.filter(req => req.status === RequestStatus.PENDING).length || 0;
    const assignedRequests = requests?.filter(req => req.status === RequestStatus.ASSIGNED).length || 0;
    const inProgressRequests = requests?.filter(req => req.status === RequestStatus.IN_PROGRESS).length || 0;
    const completedRequests = requests?.filter(req => req.status === RequestStatus.COMPLETED).length || 0;
    
    // 마감일 지남 요청 수 계산
    const today = new Date();
    const overdueRequests = requests?.filter(req => {
      if (!req.requested_deadline) return false;
      const deadline = new Date(req.requested_deadline);
      return deadline < today && req.status !== RequestStatus.COMPLETED;
    }).length || 0;

    // 사용자 역할에 따른 내 작업 계산
    let myTasks = 0;
    switch (userRole) {
      case 'designer':
        myTasks = requests?.filter(req => req.requester_id === user.id).length || 0;
        break;
      case 'analyst':
        myTasks = requests?.filter(req => req.assignee_id === user.id).length || 0;
        break;
      case 'admin':
        myTasks = totalRequests;
        break;
      default:
        myTasks = requests?.filter(req => req.requester_id === user.id).length || 0;
    }

    // 평균 리드타임 계산 (완료된 요청만)
    let averageLeadTime = 0;
    if (completedRequests > 0) {
      const completedRequestIds = requests?.filter(req => req.status === RequestStatus.COMPLETED).map(req => req.id) || [];
      
      if (completedRequestIds.length > 0) {
        const { data: completedRequestsData, error: completedError } = await supabase
          .from('requests')
          .select('created_at, updated_at')
          .in('id', completedRequestIds)
          .eq('status', RequestStatus.COMPLETED);

        if (!completedError && completedRequestsData) {
          const leadTimes = completedRequestsData.map(req => {
            const created = new Date(req.created_at);
            const completed = new Date(req.updated_at);
            return Math.round((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)); // 일 단위
          });
          
          averageLeadTime = Math.round(leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length);
        }
      }
    }

    // 완료율 계산
    const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    const stats: DashboardStats = {
      totalRequests,
      pendingRequests,
      assignedRequests,
      inProgressRequests,
      completedRequests,
      overdueRequests,
      averageLeadTime,
      completionRate,
      myTasks
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: '통계 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

