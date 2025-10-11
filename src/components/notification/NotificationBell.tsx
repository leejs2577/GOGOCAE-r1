'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_updated' | 'request_completed' | 'file_uploaded';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  requestId?: string;
}

interface RequestSummary {
  id: string;
  title: string;
  analysis_type: string;
  priority: string;
  status: string;
  created_at: string;
  requester_name?: string;
}

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'notifications' | 'requests'>('notifications');

  // 읽지 않은 알림 개수
  const unreadCount = notifications.filter(n => !n.read).length;

  // 신규 요청 개수 (최근 7일 이내)
  const newRequestsCount = requestSummary.filter(r => {
    const createdDate = new Date(r.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate >= sevenDaysAgo && (r.status === 'pending' || r.status === 'assigned');
  }).length;

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // 알림 데이터와 요청 요약 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 알림 데이터 가져오기
        const notificationResponse = await fetch('/api/notifications');
        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json();
          setNotifications(notificationData.notifications || []);
        }

        // 요청 요약 데이터 가져오기
        const requestResponse = await fetch('/api/notifications/requests-summary');
        if (requestResponse.ok) {
          const requestData = await requestResponse.json();
          setRequestSummary(requestData.requests || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();

    // 30초마다 데이터 갱신
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 팝업을 열 때 모든 알림 읽음 처리
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // 약간의 지연 후 읽음 처리 (사용자가 확인할 시간 제공)
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, unreadCount]);

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // 알림 아이콘 색상
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'request_created':
        return '🆕';
      case 'request_assigned':
        return '👤';
      case 'request_updated':
        return '🔄';
      case 'request_completed':
        return '✅';
      case 'file_uploaded':
        return '📎';
      default:
        return '📌';
    }
  };

  // 시간 포맷
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // 초 단위

    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      {/* 알림 벨 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 알림 패널 */}
          <Card className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-hidden z-50 shadow-xl">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">알림 센터</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* 탭 */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  알림
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'requests'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  요청
                  {newRequestsCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                      {newRequestsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 내용 */}
            <div className="max-h-[400px] overflow-y-auto">
              {activeTab === 'notifications' ? (
                // 알림 탭
                notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">새로운 알림이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'p-4 hover:bg-gray-50 transition-colors relative group',
                          !notification.read && 'bg-blue-50/50'
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          {/* 아이콘 */}
                          <div className="flex-shrink-0 text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* 내용 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                          >
                            <X className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>

                        {/* 읽지 않음 표시 */}
                        {!notification.read && (
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r" />
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // 요청 탭
                requestSummary.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">새로운 요청이 없습니다</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {requestSummary.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          window.location.href = `/requests/${request.id}`;
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          {/* 상태 아이콘 */}
                          <div className="flex-shrink-0">
                            <div className={`w-3 h-3 rounded-full mt-1 ${
                              request.status === 'pending' ? 'bg-gray-500' :
                              request.status === 'assigned' ? 'bg-blue-500' :
                              request.status === 'in_progress' ? 'bg-purple-500' :
                              'bg-green-500'
                            }`}></div>
                          </div>

                          {/* 내용 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                              {request.title}
                            </p>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {request.analysis_type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                request.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                request.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                request.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {request.priority === 'urgent' ? '긴급' :
                                 request.priority === 'high' ? '높음' :
                                 request.priority === 'medium' ? '보통' : '낮음'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400">
                              {formatTime(request.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
