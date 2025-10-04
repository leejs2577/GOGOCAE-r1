'use client';

import { ReactNode } from 'react';
import { UserRole } from '@/domains/auth/types';
import { useUserRole } from '@/hooks/useUserRole';

interface RoleGuardProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export const RoleGuard = ({ 
  children, 
  roles, 
  fallback = null, 
  requireAll = false 
}: RoleGuardProps) => {
  const { user, isLoading, hasAnyRole } = useUserRole();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded" />;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  const hasPermission = requireAll 
    ? roles.every(role => user.role === role)
    : hasAnyRole(roles);

  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

// 편의 컴포넌트들
export const DesignerOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.DESIGNER]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AnalystOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.ANALYST]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const DesignerAndAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.DESIGNER, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const AnalystAndAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.ANALYST, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

