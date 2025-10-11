import { supabase } from '@/lib/supabase/client';
import type { Request, CreateRequestData, UpdateRequestData } from '../types';

// 요청 목록 조회 (역할별 필터링)
export const getRequests = async (): Promise<{ requests: Request[]; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { requests: [], error: '인증이 필요합니다.' };
    }

    // 사용자 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { requests: [], error: '사용자 프로필을 찾을 수 없습니다.' };
    }

    let query = supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    // 역할별 필터링
    switch (profile.role) {
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
        return { requests: [], error: '권한이 없습니다.' };
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error('Get requests error:', requestsError);
      return { requests: [], error: requestsError.message };
    }

    // 사용자 ID 수집
    const requesterIds = [...new Set(requests.map(r => r.requester_id).filter(Boolean))];
    const assigneeIds = [...new Set(requests.map(r => r.assignee_id).filter(Boolean))];
    const allUserIds = [...requesterIds, ...assigneeIds];

    // 사용자 정보 조회 (profiles 테이블에서)
    let userProfiles: any[] = [];
    if (allUserIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .in('id', allUserIds);
      
      if (profilesError) {
        console.error('Get profiles error:', profilesError);
        // 프로필 조회 실패해도 요청 목록은 반환
      } else {
        userProfiles = profiles || [];
      }
    }

    // 사용자 정보 매핑을 위한 Map 생성
    const userMap = new Map(userProfiles.map(user => [user.id, user]));

    // 데이터 변환
    const transformedRequests: Request[] = requests.map(request => ({
      ...request,
      requester: request.requester_id ? userMap.get(request.requester_id) : undefined,
      assignee: request.assignee_id ? userMap.get(request.assignee_id) : undefined,
    }));

    return { requests: transformedRequests };
  } catch (error) {
    console.error('Get requests error:', error);
    return { requests: [], error: '요청 목록을 가져오는 중 오류가 발생했습니다.' };
  }
};

// 요청 생성
export const createRequest = async (data: CreateRequestData): Promise<{ request?: Request; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: '인증이 필요합니다.' };
    }

    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        ...data,
        requester_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create request error:', error);
      return { error: error.message };
    }

    return { request };
  } catch (error) {
    console.error('Create request error:', error);
    return { error: '요청 생성 중 오류가 발생했습니다.' };
  }
};

// 요청 업데이트
export const updateRequest = async (id: string, data: UpdateRequestData): Promise<{ request?: Request; error?: string }> => {
  try {
    const { data: request, error } = await supabase
      .from('requests')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update request error:', error);
      return { error: error.message };
    }

    return { request };
  } catch (error) {
    console.error('Update request error:', error);
    return { error: '요청 업데이트 중 오류가 발생했습니다.' };
  }
};

// 요청 삭제 (관리자만)
export const deleteRequest = async (id: string): Promise<{ error?: string }> => {
  try {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete request error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Delete request error:', error);
    return { error: '요청 삭제 중 오류가 발생했습니다.' };
  }
};
