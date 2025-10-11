'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Request } from '@/domains/request/types';
import { Badge } from '@/components/ui/badge';

interface CalendarViewProps {
  requests: Request[];
  currentDate?: Date;
  onEventClick?: (event: any) => void;
}

export default function CalendarView({ requests, currentDate = new Date(), onEventClick }: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 캘린더 그리드 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i)
      });
    }

    // 현재 달 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day)
      });
    }

    // 다음 달 날짜들 (7의 배수로 맞추기)
    const remainingDays = 42 - days.length; // 6주 * 7일
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(year, month + 1, day)
      });
    }

    return days;
  }, [year, month]);

  // 날짜별 이벤트 매핑
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Request[]>();

    requests.forEach(request => {
      // 마감일 기준으로 표시 (없으면 생성일)
      const eventDate = request.requested_deadline
        ? new Date(request.requested_deadline)
        : new Date(request.created_at);

      const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(request);
    });

    return map;
  }, [requests]);

  // 오늘 날짜 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return eventsByDate.get(dateKey) || [];
  };

  // 상태별 색상 가져오기
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-purple-500';
      case 'assigned':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in_progress': return '진행중';
      case 'assigned': return '지정됨';
      case 'pending': return '대기';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  return (
    <Card className="p-6">
      {/* 캘린더 헤더 */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-semibold py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
        {calendarDays.map((dayInfo, index) => {
          const dayOfWeek = index % 7;
          const events = getEventsForDate(dayInfo.date);

          return (
            <div
              key={`${dayInfo.date.toISOString()}-${index}`}
              className={`bg-white min-h-[140px] p-2 ${
                !dayInfo.isCurrentMonth ? 'bg-gray-50' : ''
              } ${
                isToday(dayInfo.date) ? 'ring-2 ring-inset ring-blue-500' : ''
              }`}
            >
              {/* 날짜 표시 */}
              <div className={`text-sm font-semibold mb-2 ${
                !dayInfo.isCurrentMonth ? 'text-gray-400' :
                isToday(dayInfo.date) ? 'text-blue-600' :
                dayOfWeek === 0 ? 'text-red-600' :
                dayOfWeek === 6 ? 'text-blue-600' :
                'text-gray-900'
              }`}>
                {dayInfo.day}
              </div>

              {/* 이벤트 목록 */}
              <div className="space-y-1">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick && onEventClick(event)}
                    className={`
                      px-2 py-1 rounded text-xs cursor-pointer
                      transition-colors truncate
                      ${getStatusColor(event.status)}
                    `}
                    title={`${event.title} - ${getStatusLabel(event.status)}`}
                  >
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(event.status)}`}></div>
                      <span className="truncate font-medium">{event.title}</span>
                    </div>
                  </div>
                ))}

                {/* 더 많은 이벤트가 있을 경우 */}
                {events.length > 3 && (
                  <div className="text-xs text-gray-500 pl-2 cursor-pointer hover:text-gray-700">
                    +{events.length - 3}개 더보기
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-700">대기</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-700">지정됨</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-700">진행중</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-700">완료</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-700">취소됨</span>
        </div>
      </div>
    </Card>
  );
}
