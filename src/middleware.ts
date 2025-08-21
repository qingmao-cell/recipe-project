import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 如果访问根路径，重定向到 /zh
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/zh', request.url));
  }
  
  // 其他路径正常通过
  return NextResponse.next();
}

export const config = {
  matcher: '/'
};