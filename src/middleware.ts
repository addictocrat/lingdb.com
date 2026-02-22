import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run i18n middleware first (handles locale routing)
  const intlResponse = intlMiddleware(request);

  // 2. Run Supabase auth session refresh + route protection
  // We pass the intlResponse to updateSession so Supabase can add its cookies to it
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
