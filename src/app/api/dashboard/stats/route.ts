import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RequestStatus } from '@/domains/request/types';

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  assignedRequests: number;
  inProgressRequests: number;
  completedRequests: number;
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

    // 모든 요청 데이터 가져오기
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

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

    // 사용자 역할에 따른 내 작업 계산
    let myTasks = 0;
    if (user.role === 'designer') {
      myTasks = requests?.filter(req => req.requester_id === user.id).length || 0;
    } else if (user.role === 'analyst') {
      myTasks = requests?.filter(req => req.assignee_id === user.id).length || 0;
    } else if (user.role === 'admin') {
      myTasks = totalRequests;
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

