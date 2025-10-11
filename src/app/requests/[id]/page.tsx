'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Home, Calendar, User, FileText, Download, Upload, FileUp, Plus, UserCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Request, RequestFile, REQUEST_STATUS_LABELS, REQUEST_PRIORITY_LABELS } from '@/domains/request/types';
import FileList from '@/components/file-upload/FileList';
import FileUpload from '@/components/file-upload/FileUpload';
import ReportUploadForm from '@/components/report-upload/ReportUploadForm';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { role, canCreateRequest } = useUserRole();
  
  
  const [request, setRequest] = useState<Request | null>(null);
  const [files, setFiles] = useState<RequestFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReportUploadOpen, setIsReportUploadOpen] = useState(false);

  const requestId = params.id as string;

  // UUID 형식 검증
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  useEffect(() => {
    if (!requestId) return;

    // UUID 형식이 아닌 경우 에러 처리
    if (!isValidUUID(requestId)) {
      console.error('Invalid request ID format:', requestId);
      setError('잘못된 요청 ID 형식입니다.');
      setLoading(false);
      return;
    }

    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/requests/${requestId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '요청을 가져오는데 실패했습니다.');
        }

        setRequest(data.request);
      } catch (error) {
        console.error('Fetch request error:', error);
        setError(error instanceof Error ? error.message : '요청을 가져오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
    
    // 파일 목록 조회
    const fetchFilesInitial = async () => {
      try {
        const response = await fetch(`/api/requests/${requestId}/files`);
        const data = await response.json();

        if (response.ok) {
          setFiles(data.files || []);
        }
      } catch (error) {
        console.error('Fetch files error:', error);
      }
    };
    fetchFilesInitial();
  }, [requestId]);

  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/requests/${requestId}/files`);
      const data = await response.json();

      if (response.ok) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Fetch files error:', error);
    }
  };

  const handleFileUploadComplete = () => {
    // 파일 목록 새로고침
    fetchFiles();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUploadFiles = () => {
    if (!request || !user) return false;
    return role === 'admin' || 
           (role === 'designer' && request.requester_id === user.id) ||
           (role === 'analyst' && request.assignee_id === user.id);
  };

  const canDownloadFiles = () => {
    if (!request || !user) return false;
    return role === 'admin' || 
           request.requester_id === user.id || 
           request.assignee_id === user.id;
  };

  const canUploadReport = () => {
    if (!request || !user) {
      return false;
    }
    const isAnalyst = role === 'analyst';
    const isAssignee = request.assignee_id === user.id;
    return isAnalyst && isAssignee;
  };

  const canAssignSelf = () => {
    if (!request || !user) {
      return false;
    }
    const isAnalyst = role === 'analyst';
    const isNotAssigned = !request.assignee_id;
    const isNotAlreadyAssignee = request.assignee_id !== user.id;
    return isAnalyst && isNotAssigned && isNotAlreadyAssignee;
  };

  const handleAssignSelf = async () => {
    if (!request || !user) {
      return;
    }

    try {
      const response = await fetch(`/api/requests/${requestId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignee_id: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '담당자 지정에 실패했습니다.');
      }

      // 요청 정보 새로고침
      const requestResponse = await fetch(`/api/requests/${requestId}`);
      const requestData = await requestResponse.json();
      if (requestResponse.ok) {
        setRequest(requestData.request);
      }
    } catch (error) {
      console.error('Assign self error:', error);
      alert(error instanceof Error ? error.message : '담당자 지정에 실패했습니다.');
    }
  };

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

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">오류</h2>
              <p className="text-gray-600 mb-4">
                {error || '요청을 찾을 수 없습니다.'}
              </p>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-500">
                  현재 URL: <code className="bg-gray-200 px-2 py-1 rounded text-xs">{requestId}</code>
                </p>
                <p className="text-sm text-gray-500">
                  올바른 요청 ID는 UUID 형식이어야 합니다
                </p>
              </div>
              <div className="space-x-2">
                <Button onClick={() => router.push('/requests')}>
                  요청 목록으로 돌아가기
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                  대시보드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              뒤로가기
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
              <p className="text-gray-600">해석 요청 상세 정보</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {REQUEST_STATUS_LABELS[request.status]}
              </Badge>
              <Badge variant="secondary">
                {REQUEST_PRIORITY_LABELS[request.priority]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">설명</label>
                  <p className="mt-1 text-gray-900">{request.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">차종</label>
                    <p className="mt-1 text-gray-900">{request.car_model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">해석 유형</label>
                    <p className="mt-1 text-gray-900">{request.analysis_type}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">요청 마감일</label>
                  <p className="mt-1 text-gray-900">{formatDate(request.requested_deadline)}</p>
                </div>
              </CardContent>
            </Card>

            {/* 파일 목록 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  첨부 파일
                </CardTitle>
                <CardDescription>
                  해석에 필요한 모델 파일과 보고서
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileList
                  requestId={requestId}
                  files={files}
                  onFileDeleted={handleFileDeleted}
                  canDelete={canUploadFiles()}
                />
              </CardContent>
            </Card>

            {/* 파일 업로드 (권한이 있는 경우) */}
            {canUploadFiles() && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    파일 업로드
                  </CardTitle>
                  <CardDescription>
                    해석 보고서나 추가 파일을 업로드하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    requestId={requestId}
                    onUploadComplete={handleFileUploadComplete}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 요청자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  요청자
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.requester && (
                  <div className="space-y-2">
                    <p className="font-medium">{request.requester.full_name || request.requester.email}</p>
                    <p className="text-sm text-gray-500">{request.requester.email}</p>
                    <Badge variant="outline">{request.requester.role}</Badge>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">요청일</p>
                  <p className="text-sm">{formatDate(request.created_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* 담당자 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  담당자
                </CardTitle>
              </CardHeader>
              <CardContent>
                {request.assignee ? (
                  <div className="space-y-2">
                    <p className="font-medium">{request.assignee.full_name || request.assignee.email}</p>
                    <p className="text-sm text-gray-500">{request.assignee.email}</p>
                    <Badge variant="outline">{request.assignee.role}</Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">담당자가 지정되지 않았습니다</p>
                    </div>
                    
                    {/* 담당자 지정 버튼 (해석자만) */}
                    {canAssignSelf() && (
                      <Button 
                        onClick={handleAssignSelf}
                        className="w-full"
                        size="sm"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        나를 담당자로 지정
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 상태 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  상태 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">현재 상태</label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">우선순위</label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {REQUEST_PRIORITY_LABELS[request.priority]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">마지막 업데이트</label>
                  <p className="mt-1 text-sm">{formatDate(request.updated_at)}</p>
                </div>
              </CardContent>
            </Card>


            {/* 해석자 보고서 업로드 버튼 */}
            {canUploadReport() && (
              <Card>
                <CardContent className="pt-6">
                  <Dialog open={isReportUploadOpen} onOpenChange={setIsReportUploadOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        보고서 업로드
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>해석 보고서 업로드</DialogTitle>
                        <DialogDescription>
                          해석 결과 보고서와 특이사항을 업로드해주세요
                        </DialogDescription>
                      </DialogHeader>
                      <ReportUploadForm 
                        requestId={requestId}
                        onUploadComplete={() => {
                          setIsReportUploadOpen(false);
                          fetchFiles(); // 파일 목록 새로고침
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
