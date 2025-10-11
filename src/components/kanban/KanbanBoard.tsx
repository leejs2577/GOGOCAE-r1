'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Request, RequestStatus } from '@/domains/request/types';
import RequestCard from './RequestCard';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  requests: Request[];
  onStatusChange?: (requestId: string, newStatus: RequestStatus) => void;
  onCardClick?: (request: Request) => void;
  userRole?: string; // 사용자 역할 추가
}

interface RequestColumn {
  id: RequestStatus;
  title: string;
  color: string;
  requests: Request[];
}

const columns: Array<{ id: RequestStatus; title: string; color: string }> = [
  { id: RequestStatus.PENDING, title: '담당자 미지정', color: 'bg-gray-100' },
  { id: RequestStatus.ASSIGNED, title: '시작전', color: 'bg-blue-100' },
  { id: RequestStatus.IN_PROGRESS, title: '진행중', color: 'bg-purple-100' },
  { id: RequestStatus.COMPLETED, title: '완료', color: 'bg-green-100' },
];

export default function KanbanBoard({ requests, onStatusChange, onCardClick, userRole }: KanbanBoardProps) {
  const [kanbanColumns, setKanbanColumns] = useState<RequestColumn[]>([]);
  const { toast } = useToast();

  const groupRequestsByStatus = (requests: Request[]): RequestColumn[] => {
    return columns.map(col => ({
      ...col,
      requests: requests.filter(request => request.status === col.id)
    }));
  };

  useEffect(() => {
    setKanbanColumns(groupRequestsByStatus(requests));
  }, [requests]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // 설계자는 드래그 앤 드롭 불가
    if (userRole === 'designer') {
      return;
    }

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newColumns = [...kanbanColumns];
    const sourceColumn = newColumns.find(col => col.id === source.droppableId);
    const destColumn = newColumns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) {
      return;
    }

    const request = sourceColumn.requests.find(req => req.id === draggableId);
    if (!request) {
      return;
    }

    sourceColumn.requests.splice(source.index, 1);
    destColumn.requests.splice(destination.index, 0, {
      ...request,
      status: destination.droppableId as RequestStatus
    });

    setKanbanColumns(newColumns);

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

      if (onStatusChange) {
        onStatusChange(draggableId, destination.droppableId as RequestStatus);
      }

      toast({
        title: "상태 변경 완료",
        description: "요청 상태가 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error('Status change error:', error);
      setKanbanColumns(groupRequestsByStatus(requests));

      toast({
        title: "상태 변경 실패",
        description: "요청 상태 변경에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kanbanColumns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* 컬럼 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  column.id === RequestStatus.PENDING ? 'bg-gray-500' :
                  column.id === RequestStatus.ASSIGNED ? 'bg-blue-500' :
                  column.id === RequestStatus.IN_PROGRESS ? 'bg-purple-500' :
                  'bg-green-500'
                }`}></div>
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="text-sm text-gray-500">{column.requests.length}</span>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <Plus className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* 드롭 영역 */}
            <Droppable droppableId={column.id} isDropDisabled={userRole === 'designer'}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 rounded-lg p-3 transition-colors min-h-[600px] ${
                    userRole === 'designer' 
                      ? 'bg-gray-50 opacity-75' // 설계자에게는 투명도 적용
                      : snapshot.isDraggingOver
                        ? 'bg-blue-50 border-2 border-dashed border-blue-300'
                        : 'bg-gray-50'
                  }`}
                >
                  <div className="space-y-3">
                    {column.requests.map((request, index) => (
                      <Draggable
                        key={request.id}
                        draggableId={request.id}
                        index={index}
                        isDragDisabled={userRole === 'designer'} // 설계자는 드래그 비활성화
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(userRole !== 'designer' ? provided.dragHandleProps : {})} // 설계자는 드래그 핸들 비활성화
                            className={`${
                              snapshot.isDragging ? 'rotate-2 shadow-xl' : ''
                            } ${userRole === 'designer' ? 'cursor-default' : 'cursor-grab'}`} // 설계자는 기본 커서
                          >
                            <Card
                              className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                              onClick={() => onCardClick && onCardClick(request)}
                            >
                              {/* 우선순위 표시 */}
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span className="text-xs text-gray-500 uppercase tracking-wide">
                                  {request.id.substring(0, 8)}
                                </span>
                              </div>

                              {/* 제목 */}
                              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {request.title}
                              </h4>

                              {/* 설명 */}
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {request.description}
                              </p>

                              {/* 태그 */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                  {request.analysis_type}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {request.car_model}
                                </span>
                              </div>

                              {/* 하단 정보 */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                      {request.requester?.email?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                  <span className="text-xs">
                                    {request.requester?.full_name || request.requester?.email}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span>3</span>
                                </div>
                              </div>

                              {/* 마감일 */}
                              {request.requested_deadline && (
                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
                                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  오전 {new Date(request.requested_deadline).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* 빈 상태 */}
                    {column.requests.length === 0 && (
                      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                        항목 없음
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
