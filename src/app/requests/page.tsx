'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserCheck, UserX, CheckCircle, Play, Clock, Home, FileText, FileUp, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { RequestStatus, RequestPriority, REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS, REQUEST_PRIORITY_COLORS, type Request } from '@/domains/request/types';
import ReportUploadForm from '@/components/report-upload/ReportUploadForm';

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRequests, setUpdatingRequests] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { role, canCreateRequest, canViewAllRequests, canAssignRequest, isAdmin } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();

  // 요청 목록 로드
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

  // 필터링된 요청 목록
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    // 날짜 범위 필터링
    const matchesDateRange = (() => {
      if (!dateRange.from && !dateRange.to) return true;
      
      const requestDate = new Date(request.request_date);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;
      
      if (fromDate && toDate) {
        return requestDate >= fromDate && requestDate <= toDate;
      } else if (fromDate) {
        return requestDate >= fromDate;
      } else if (toDate) {
        return requestDate <= toDate;
      }
      return true;
    })();
    
    // 사용자의 역할에 따라 자신이 생성했거나 담당한 요청만 보이도록 추가 필터링
    const matchesRole = 
      isAdmin || // 관리자는 모두 볼 수 있음
      (user?.role === 'designer' && request.requester_id === user?.id) || // 설계자는 자신이 요청한 것만
      (user?.role === 'analyst' && (request.assignee_id === user?.id || !request.assignee_id)); // 해석자는 자신에게 할당된 것 + 미할당 요청
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDateRange && matchesRole;
  });

  const handleCreateRequest = () => {
    router.push('/requests/create');
  };

  const handleViewRequest = (id: string) => {
    router.push(`/requests/${id}`);
  };

  const handleEditRequest = (id: string) => {
    router.push(`/requests/${id}/edit`);
  };

  const handleDeleteRequest = async (id: string) => {
    if (confirm('이 요청을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/requests/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // 목록에서 제거
          setRequests(prev => prev.filter(req => req.id !== id));
          toast({
            title: '요청 삭제',
            description: '요청이 삭제되었습니다.',
          });
        } else {
          const data = await response.json();
          toast({
            variant: 'destructive',
            title: '삭제 실패',
            description: data.error || '삭제 중 오류가 발생했습니다.',
          });
        }
      } catch (error) {
        console.error('Delete request error:', error);
        toast({
          variant: 'destructive',
          title: '삭제 실패',
          description: '삭제 중 오류가 발생했습니다.',
        });
      }
    }
  };

  // 담당자 지정
  const handleAssignRequest = async (id: string) => {
    console.log('Frontend - Assign request ID:', id);
    setUpdatingRequests(prev => new Set(prev).add(id));
    try {
      const response = await fetch(`/api/requests/${id}/assign`, {
        method: 'PUT',
      });

      const data = await response.json();

      if (response.ok) {
        // Optimistic UI 업데이트
        setRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, assignee_id: user?.id, status: RequestStatus.ASSIGNED }
            : req
        ));
        toast({
          title: '담당자 지정',
          description: data.message || '담당자로 지정되었습니다.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: '담당자 지정 실패',
          description: data.error || '담당자 지정 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('Assign request error:', error);
      toast({
        variant: 'destructive',
        title: '담당자 지정 실패',
        description: '담당자 지정 중 오류가 발생했습니다.',
      });
    } finally {
      setUpdatingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 담당자 지정 해제
  const handleUnassignRequest = async (id: string) => {
    setUpdatingRequests(prev => new Set(prev).add(id));
    try {
      const response = await fetch(`/api/requests/${id}/assign`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Optimistic UI 업데이트
        setRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, assignee_id: null, status: RequestStatus.PENDING }
            : req
        ));
        toast({
          title: '담당자 해제',
          description: data.message || '담당자 지정이 해제되었습니다.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: '담당자 해제 실패',
          description: data.error || '담당자 해제 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('Unassign request error:', error);
      toast({
        variant: 'destructive',
        title: '담당자 해제 실패',
        description: '담당자 해제 중 오류가 발생했습니다.',
      });
    } finally {
      setUpdatingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  // 상태 변경
  const handleStatusChange = async (id: string, newStatus: RequestStatus) => {
    setUpdatingRequests(prev => new Set(prev).add(id));
    try {
      const response = await fetch(`/api/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        // Optimistic UI 업데이트
        setRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, status: newStatus }
            : req
        ));
        toast({
          title: '상태 변경',
          description: data.message || '상태가 변경되었습니다.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: '상태 변경 실패',
          description: data.error || '상태 변경 중 오류가 발생했습니다.',
        });
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast({
        variant: 'destructive',
        title: '상태 변경 실패',
        description: '상태 변경 중 오류가 발생했습니다.',
      });
    } finally {
      setUpdatingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">해석 요청</h1>
              <p className="text-gray-600">CAE 해석 요청을 관리하세요</p>
            </div>
            {canCreateRequest && (
              <Button onClick={handleCreateRequest}>
                <Plus className="mr-2 h-4 w-4" />
                새 요청 생성
              </Button>
            )}
          </div>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="요청명 또는 설명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="상태별 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value={RequestStatus.PENDING}>대기중</SelectItem>
                    <SelectItem value={RequestStatus.ASSIGNED}>담당자 지정됨</SelectItem>
                    <SelectItem value={RequestStatus.IN_PROGRESS}>진행중</SelectItem>
                    <SelectItem value={RequestStatus.COMPLETED}>완료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 우선순위 필터 */}
              <div className="sm:w-48">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="우선순위별 필터" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 우선순위</SelectItem>
                    <SelectItem value={RequestPriority.LOW}>낮음</SelectItem>
                    <SelectItem value={RequestPriority.MEDIUM}>보통</SelectItem>
                    <SelectItem value={RequestPriority.HIGH}>높음</SelectItem>
                    <SelectItem value={RequestPriority.URGENT}>긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 날짜 범위 필터 */}
              <div className="sm:w-64">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from || dateRange.to ? (
                        <>
                          {dateRange.from ? dateRange.from.toLocaleDateString('ko-KR') : '시작일'} ~ 
                          {dateRange.to ? dateRange.to.toLocaleDateString('ko-KR') : '종료일'}
                        </>
                      ) : (
                        '날짜 범위 선택'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">시작일</label>
                        <Input
                          type="date"
                          value={dateRange.from ? dateRange.from.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setDateRange(prev => ({ ...prev, from: date }));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">종료일</label>
                        <Input
                          type="date"
                          value={dateRange.to ? dateRange.to.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : undefined;
                            setDateRange(prev => ({ ...prev, to: date }));
                          }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDateRange({ from: undefined, to: undefined });
                            setDatePickerOpen(false);
                          }}
                        >
                          초기화
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setDatePickerOpen(false)}
                        >
                          적용
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 요청 목록 */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">로딩 중...</p>
                </div>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-gray-500">요청이 없습니다.</p>
                  {canCreateRequest && (
                    <Button 
                      onClick={handleCreateRequest}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      첫 요청 생성하기
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.title}
                        </h3>
                        <Badge className={REQUEST_PRIORITY_COLORS[request.priority]}>
                          {REQUEST_PRIORITY_LABELS[request.priority]}
                        </Badge>
                        <Badge variant="outline">
                          {REQUEST_STATUS_LABELS[request.status]}
                        </Badge>
                        {request.has_report && (
                          <Badge variant="default" className="bg-blue-500">
                            <FileUp className="h-3 w-3 mr-1" />
                            보고서
                          </Badge>
                        )}
                      </div>
                      
                      {request.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {request.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>차종: {request.vehicle_type}</span>
                        <span>요청일: {formatDate(request.request_date)}</span>
                        {request.due_date && (
                          <span>마감일: {formatDate(request.due_date)}</span>
                        )}
                        {request.assignee_id && (
                          <span>담당자: 해석자 1</span>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log('View request ID:', request.id);
                          handleViewRequest(request.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {(user?.id === request.requester_id || canViewAllRequests) && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRequest(request.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 담당자 지정/해제 버튼 (해석자용) */}
                  {canAssignRequest && (
                    <div className="flex gap-2 mt-3">
                      {!request.assignee_id && request.status === RequestStatus.PENDING && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleAssignRequest(request.id)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" /> 
                          담당자 지정
                        </Button>
                      )}
                      
                      {request.assignee_id === user?.id && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUnassignRequest(request.id)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" /> 
                          담당 해제
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 상태 변경 버튼 (담당자 또는 관리자용) */}
                  {(request.assignee_id === user?.id || isAdmin) && request.assignee_id && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {request.status === RequestStatus.ASSIGNED && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleStatusChange(request.id, RequestStatus.IN_PROGRESS)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <Play className="mr-2 h-4 w-4" /> 
                          작업 시작
                        </Button>
                      )}
                      
                      {request.status === RequestStatus.IN_PROGRESS && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleStatusChange(request.id, RequestStatus.COMPLETED)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" /> 
                          완료
                        </Button>
                      )}
                      
                      {request.status === RequestStatus.COMPLETED && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleStatusChange(request.id, RequestStatus.IN_PROGRESS)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <Clock className="mr-2 h-4 w-4" /> 
                          재시작
                        </Button>
                      )}
                      
                      {request.status === RequestStatus.IN_PROGRESS && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleStatusChange(request.id, RequestStatus.ASSIGNED)}
                          disabled={updatingRequests.has(request.id)}
                        >
                          <Clock className="mr-2 h-4 w-4" /> 
                          대기
                        </Button>
                      )}
                    </div>
                  )}

                  {/* 해석 보고서 업로드 버튼 (담당자용) */}
                  {request.assignee_id === user?.id && role === 'analyst' && (
                    <div className="mt-3">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <FileText className="mr-2 h-4 w-4" />
                            해석 보고서
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>해석 보고서 작성</DialogTitle>
                            <DialogDescription>
                              해석 결과와 특이사항을 작성하고 보고서를 업로드해주세요
                            </DialogDescription>
                          </DialogHeader>
                          <ReportUploadForm 
                            requestId={request.id}
                            onUploadComplete={() => {
                              // 업로드 완료 후 처리
                              toast({
                                title: "보고서 업로드 완료",
                                description: "해석 보고서가 성공적으로 업로드되었습니다.",
                              });
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* 통계 정보 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>요청 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === RequestStatus.PENDING).length}
                </p>
                <p className="text-sm text-gray-600">대기중</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === RequestStatus.IN_PROGRESS).length}
                </p>
                <p className="text-sm text-gray-600">진행중</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === RequestStatus.COMPLETED).length}
                </p>
                <p className="text-sm text-gray-600">완료</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {requests.length}
                </p>
                <p className="text-sm text-gray-600">전체</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
