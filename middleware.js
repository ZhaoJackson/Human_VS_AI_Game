import { NextResponse } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

// ─── Auth gate — set NEXT_PUBLIC_AUTH_ENABLED=true in Vercel env vars to re-enable ───
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';

// Full Columbia-login middleware (preserved for re-activation)
const authMiddleware = withMiddlewareAuthRequired(async (req) => {
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN?.toLowerCase();
  const email = req.auth?.user?.email?.toLowerCase();

  if (allowedDomain && email && !email.endsWith(`@${allowedDomain}`)) {
    const logoutUrl = req.nextUrl.clone();
    logoutUrl.pathname = '/api/auth/logout';
    logoutUrl.searchParams.set('returnTo', '/?auth=domain');
    return NextResponse.redirect(logoutUrl);
  }

  return NextResponse.next();
});

export default function middleware(req) {
  // When auth is disabled, pass every request straight through
  if (!AUTH_ENABLED) return NextResponse.next();
  return authMiddleware(req);
}

export const config = {
  matcher: ['/game'],
};
