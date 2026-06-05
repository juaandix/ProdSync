import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren estar autenticado
const authRoutes = ['/', '/dashboard', '/calendar', '/clients', '/users', '/projects', '/time-entries'];

// Rutas exclusivas para admin
const adminRoutes = ['/users'];

// Rutas para admin y operator
const operatorRoutes = ['/clients'];

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. Si no hay token y la ruta requiere autenticación → signin
  const requiresAuth = authRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (requiresAuth && !authToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  // 2. Rutas solo para admin
  const isAdminRoute = adminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (isAdminRoute && userRole !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }

  // 3. Rutas para admin y operator
  const isOperatorRoute = operatorRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  if (isOperatorRoute && userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
    const url = request.nextUrl.clone();
    url.pathname = '/unauthorized';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|signin|signup|unauthorized).*)',
  ],
}
