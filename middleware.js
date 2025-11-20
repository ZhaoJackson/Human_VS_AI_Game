import { NextResponse } from 'next/server';
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

export default withMiddlewareAuthRequired(async (req) => {
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

export const config = {
  matcher: ['/game']
};
