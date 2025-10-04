'use client';

import { useState } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Search, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Request, RequestStatus, RequestPriority } from '@/domains/request/types';
import { useRouter } from 'next/navigation';

// moment 로케일 설정
import 'moment/locale/ko';
moment.locale('ko');

// react-big-calendar 로케일 설정
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    request: Request;
  };
}

interface CalendarViewProps {
  requests: Request[];
  onEventClick?: (event: CalendarEvent) => void;
}

export default function CalendarView({ requests, onEventClick }: CalendarViewProps) {
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // 요청을 캘린더 이벤트로 변환
  const events: CalendarEvent[] = requests
    .filter(request => {
      // 검색 필터
      if (searchTerm && !request.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // 상태 필터
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      // 우선순위 필터
      if (priorityFilter !== 'all' && request.priority !== priorityFilter) {
        return false;
      }
      return true;
    })
    .map(request => ({
      id: request.id,
      title: request.title,
      start: new Date(request.created_at),
      end: request.requested_deadline ? new Date(request.requested_deadline) : new Date(request.created_at),
      resource: {
        request
      }
    }));

  // 이벤트 클릭 핸들러
  const handleEventClick = (event: CalendarEvent) => {
    if (onEventClick) {
      onEventClick(event);
    } else {
      router.push(`/requests/${event.id}`);
    }
  };

  // 이벤트 스타일 커스터마이징
  const eventStyleGetter = (event: CalendarEvent) => {
    const request = event.resource.request;
    const priorityClass = `priority-${request.priority}`;
    
    return {
      className: priorityClass,
      style: {
        backgroundColor: getPriorityColor(request.priority),
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        fontWeight: '500',
        padding: '2px 6px',
        margin: '1px 2px',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }
    };
  };

  // 우선순위별 색상 반환
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  // 이벤트 제목 포맷터
  const eventPropGetter = (event: CalendarEvent) => {
    return {
      title: event.resource.request.title
    };
  };

  // 커스텀 툴바 컴포넌트
  const CustomToolbar = (props: any) => {
    const goToBack = () => props.onNavigate('PREV');
    const goToNext = () => props.onNavigate('NEXT');
    const goToCurrent = () => props.onNavigate('TODAY');

    return (
      <div className="rbc-toolbar">
        <div className="rbc-toolbar-nav-group">
          <button onClick={goToBack} className="nav-arrow-btn">
            &lt;
          </button>
          <span className="rbc-toolbar-label">
            {moment(props.date).format('YYYY년 M월')}
          </span>
          <button onClick={goToNext} className="nav-arrow-btn">
            &gt;
          </button>
        </div>
        <button onClick={goToCurrent} className="today-btn">
          오늘
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            캘린더 뷰
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 검색 및 필터 */}
          <div className="calendar-search-container">
            <div className="calendar-search">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="요청명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="calendar-filter">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 필터" />
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

            <div className="calendar-filter">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="우선순위 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 우선순위</SelectItem>
                  <SelectItem value={RequestPriority.HIGH}>높음</SelectItem>
                  <SelectItem value={RequestPriority.MEDIUM}>보통</SelectItem>
                  <SelectItem value={RequestPriority.LOW}>낮음</SelectItem>
                  <SelectItem value={RequestPriority.URGENT}>긴급</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="calendar-new-request flex items-center gap-2"
              onClick={() => router.push('/requests/create')}
            >
              <Plus className="w-4 h-4" />
              새 요청
            </Button>
          </div>

          {/* 뷰 전환 버튼 */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={view === Views.MONTH ? "default" : "outline"}
              size="sm"
              onClick={() => setView(Views.MONTH)}
            >
              월
            </Button>
            <Button
              variant={view === Views.WEEK ? "default" : "outline"}
              size="sm"
              onClick={() => setView(Views.WEEK)}
            >
              주
            </Button>
            <Button
              variant={view === Views.DAY ? "default" : "outline"}
              size="sm"
              onClick={() => setView(Views.DAY)}
            >
              일
            </Button>
          </div>

          {/* 캘린더 */}
          <div className="h-[600px] border border-gray-200 rounded-lg overflow-hidden">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              components={{
                toolbar: CustomToolbar
              }}
              messages={{
                next: '다음',
                previous: '이전',
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                agenda: '일정',
                date: '날짜',
                time: '시간',
                event: '이벤트',
                noEventsInRange: '이 기간에 일정이 없습니다.',
                showMore: (total) => `+${total}개 더 보기`
              }}
              popup
              popupOffset={{ x: 0, y: 5 }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 범례 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">우선순위 범례</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>긴급</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>높음</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>보통</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>낮음</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}