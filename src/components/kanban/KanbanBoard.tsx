'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Request, RequestStatus } from '@/domains/request/types';
import { REQUEST_STATUS_LABELS } from '@/domains/request/types';
import RequestCard from './RequestCard';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  requests: Request[];
  onStatusChange?: (requestId: string, newStatus: RequestStatus) => void;
  onCardClick?: (request: Request) => void;
}

interface RequestColumn {
  id: RequestStatus;
  title: string;
  requests: Request[];
}

export default function KanbanBoard({ requests, onStatusChange, onCardClick }: KanbanBoardProps) {
  const [columns, setColumns] = useState<RequestColumn[]>([]);
  const { toast } = useToast();

  // 요청을 상태별로 그룹화 (담당자 지정됨 제외)
  const groupRequestsByStatus = (requests: Request[]): RequestColumn[] => {
    const statusOrder = [
      RequestStatus.PENDING,
      RequestStatus.IN_PROGRESS,
      RequestStatus.COMPLETED
    ];

    return statusOrder.map(status => ({
      id: status,
      title: REQUEST_STATUS_LABELS[status],
      requests: requests.filter(request => request.status === status)
    }));
  };

  // 컴포넌트 마운트 시 또는 requests 변경 시 컬럼 업데이트
  useEffect(() => {
    setColumns(groupRequestsByStatus(requests));
  }, [requests]);

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // 드롭 대상이 없으면 무시
    if (!destination) {
      return;
    }

    // 담당자 지정됨 상태는 드롭 대상에서 제외
    if (destination.droppableId === RequestStatus.ASSIGNED) {
      return;
    }

    // 같은 위치에 드롭했으면 무시
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newColumns = [...columns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    // 요청 찾기
    const request = sourceColumn.requests.find(req => req.id === draggableId);
    if (!request) {
      return;
    }

    // 소스 컬럼에서 제거
    sourceColumn.requests.splice(source.index, 1);

    // 대상 컬럼에 추가
    destColumn.requests.splice(destination.index, 0, {
      ...request,
      status: destination.droppableId as RequestStatus
    });

    setColumns(newColumns);

    // API 호출로 상태 변경
    try {
      const response = await fetch(`/api/requests/${draggableId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: destination.droppableId
        }),
      });

      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }

      // 성공 시 콜백 호출
      if (onStatusChange) {
        onStatusChange(draggableId, destination.droppableId as RequestStatus);
      }

      toast({
        title: "상태 변경 완료",
        description: "요청 상태가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error('Status change error:', error);
      
      // 실패 시 원래 상태로 되돌리기
      setColumns(groupRequestsByStatus(requests));
      
      toast({
        title: "상태 변경 실패",
        description: "요청 상태 변경에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  // 진행률 계산
  const getProgress = () => {
    const total = requests.length;
    const completed = requests.filter(req => req.status === RequestStatus.COMPLETED).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* 진행률 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 진행률</CardTitle>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>완료된 요청</span>
                <span>{getProgress()}%</span>
              </div>
              <Progress value={getProgress()} className="h-2" />
              <div className="text-xs text-gray-500">
                {requests.filter(req => req.status === RequestStatus.COMPLETED).length} / {requests.length} 완료
              </div>
            </div>
          </CardContent>
        </CardHeader>
      </Card>

      {/* 칸반 보드 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupRequestsByStatus(requests).map((column) => (
            <div key={column.id} className="space-y-4">
              {/* 컬럼 헤더 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {column.requests.length}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* 드롭 영역 */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver 
                        ? 'bg-blue-50 border-2 border-dashed border-blue-300' 
                        : 'bg-gray-50'
                    }`}
                  >
                    {column.requests.map((request, index) => (
                      <Draggable
                        key={request.id}
                        draggableId={request.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 ${
                              snapshot.isDragging ? 'rotate-3 shadow-lg' : ''
                            }`}
                          >
                            <RequestCard 
                              request={request} 
                              onCardClick={onCardClick}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {/* 빈 상태 메시지 */}
                    {column.requests.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        요청이 없습니다
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
