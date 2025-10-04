'use client';

import { Request } from '@/domains/request/types';
import { REQUEST_PRIORITY_COLORS, REQUEST_PRIORITY_LABELS } from '@/domains/request/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, User, Calendar, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RequestCardProps {
  request: Request;
  onCardClick?: (request: Request) => void;
}

export default function RequestCard({ request, onCardClick }: RequestCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(request);
    } else {
      router.push(`/requests/${request.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: REQUEST_PRIORITY_COLORS[request.priority].replace('bg-', '#').replace('-500', '') }}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 제목과 우선순위 */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 flex-1">
              {request.title}
            </h3>
            <Badge className={`${REQUEST_PRIORITY_COLORS[request.priority]} text-white text-xs`}>
              {REQUEST_PRIORITY_LABELS[request.priority]}
            </Badge>
          </div>

          {/* 설명 */}
          {request.description && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {request.description}
            </p>
          )}

          {/* 메타 정보 */}
          <div className="space-y-2">
            {/* 요청자 (설계자) */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span className="font-medium">요청자:</span>
              <span>{request.requester?.email?.split('@')[0] || '알 수 없음'}</span>
            </div>

            {/* 담당자 (해석자) */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <User className="h-3 w-3" />
              <span className="font-medium">담당자:</span>
              <span>{request.assignee?.email?.split('@')[0] || '미지정'}</span>
            </div>

            {/* 차종 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <FileText className="h-3 w-3" />
              <span>{request.vehicle_type}</span>
            </div>

            {/* 요청일 */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(request.request_date)}</span>
            </div>

            {/* 보고서 상태 */}
            {request.has_report && (
              <Badge variant="default" className="bg-blue-500 text-white text-xs">
                <FileText className="h-3 w-3 mr-1" />
                보고서
              </Badge>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              보기
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
