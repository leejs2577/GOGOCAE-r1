'use client';

import { useAuth } from '@/domains/auth/hooks/useAuth';
import { UserRole } from '@/domains/auth/types';

export const useUserRole = () => {
  const { user, isLoading } = useAuth();

  const isDesigner = user?.role === UserRole.DESIGNER;
  const isAnalyst = user?.role === UserRole.ANALYST;
  const isAdmin = user?.role === UserRole.ADMIN;

  const canCreateRequest = isDesigner || isAdmin;
  const canAssignRequest = isAnalyst || isAdmin;
  const canManageUsers = isAdmin;
  const canViewAllRequests = isAnalyst || isAdmin;
  const canEditRequest = isAnalyst || isAdmin;

  return {
    user,
    isLoading,
    role: user?.role,
    isDesigner,
    isAnalyst,
    isAdmin,
    // 권한 체크 함수들
    canCreateRequest,
    canAssignRequest,
    canManageUsers,
    canViewAllRequests,
    canEditRequest,
    // 역할 확인 헬퍼
    hasRole: (role: UserRole) => user?.role === role,
    hasAnyRole: (roles: UserRole[]) => user?.role && roles.includes(user.role),
  };
};

