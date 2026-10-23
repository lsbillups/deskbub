import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/upload(.*)']);

const protect = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // Compatibility entry only: let visitors reach Custom before authentication.
  if (req.nextUrl.pathname === '/upload' || req.nextUrl.pathname === '/upload/') {
    const destination = new URL('/custom-desktop-pet', req.url);
    if (req.nextUrl.searchParams.get('upgraded') === 'true') destination.searchParams.set('upgraded', 'true');
    destination.hash = 'custom-create';
    return NextResponse.redirect(destination, 307);
  }
  return protect(req, event);
}

export const config = {
  matcher: [
    '/dashboard(.*)',
    '/upload(.*)',
    '/api/(.*)',
  ],
};
