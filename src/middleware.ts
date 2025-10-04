import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

// 보호된 라우트들
const protectedRoutes = ['/dashboard', '/requests', '/admin'];

// 역할별 접근 제한 라우트들
const roleRestrictedRoutes = {
  '/admin': ['admin'],
  '/requests/create': ['designer', 'admin'],
  '/requests/assign': ['analyst', 'admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일이나 API 라우트는 통과
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 보호된 라우트 체크
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const supabase = createClient(request);
    const { data: { session } } = await supabase.auth.getSession();

    // 세션이 없으면 로그인 페이지로 리다이렉트
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 역할 기반 접근 제한 체크
    const userRole = session.user.user_metadata?.role;
    
    for (const [route, allowedRoles] of Object.entries(roleRestrictedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // 권한 없음 - 대시보드로 리다이렉트
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        break;
      }
    }
  }

  // 인증된 사용자가 로그인 페이지에 접근하면 대시보드로 리다이렉트
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/signup')) {
    const supabase = createClient(request);
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

