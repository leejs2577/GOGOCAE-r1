'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Kanban,
  Settings,
  LogOut,
  Mail,
  ChevronRight,
  Home,
  FileText,
  Eye,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// 역할별 네비게이션 아이템 생성
const getMainNavItems = (userRole: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      label: '대시보드',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: 'Kanban 보드',
      href: '/kanban',
      icon: <Kanban className="h-5 w-5" />,
    },
    {
      label: '캘린더',
      href: '/calendar',
      icon: <Calendar className="h-5 w-5" />,
    },
  ];

  // 설계자와 관리자에게만 신규 해석 요청 메뉴 추가
  if (userRole === 'designer' || userRole === 'admin') {
    baseItems.push({
      label: '신규 해석 요청',
      href: '/requests/create',
      icon: <FileText className="h-5 w-5" />,
    });
  }

  // 해석자에게만 해석 요청 확인 메뉴 추가
  if (userRole === 'analyst') {
    baseItems.push({
      label: '해석 요청 확인',
      href: '/requests',
      icon: <Eye className="h-5 w-5" />,
    });
  }

  // 관리자에게만 사용자 관리 메뉴 추가
  if (userRole === 'admin') {
    baseItems.push({
      label: '사용자 관리',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
    });
  }

  return baseItems;
};

const bottomNavItems: NavItem[] = [
  {
    label: '설정',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    label: 'Contact Us',
    href: '/contact',
    icon: <Mail className="h-5 w-5" />,
  },
];

export const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { role } = useUserRole();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const mainNavItems = getMainNavItems(role);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">GO</span>
          </div>
          <span className="text-xl font-bold text-gray-900">고고CAE</span>
        </button>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {isActive(item.href) && (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* 하단 네비게이션 */}
      <div className="border-t border-gray-200 px-3 py-4">
        <div className="space-y-1">
          {bottomNavItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
