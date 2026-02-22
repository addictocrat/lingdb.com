import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, response?: NextResponse) {
  let supabaseResponse = response || NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          // If we have a response, we should use it, but if we need a fresh next() to update request...
          // Actually, modifying the existing supabaseResponse is better.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth session — important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect to login if not authenticated
  const { pathname } = request.nextUrl;

  // Extract locale from path (e.g., /en/dashboard → en)
  const pathSegments = pathname.split('/').filter(Boolean);
  const locale = pathSegments[0] || 'en';

  // Check if the route is in a protected group (main)
  const isProtectedRoute =
    pathname.includes('/dashboard') ||
    (pathname.includes('/dictionary') && pathSegments.length <= 2) ||
    pathname.includes('/profile') ||
    pathname.includes('/payment') ||
    pathname.includes('/tiers');

  if (!user && isProtectedRoute) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and trying to access auth pages, redirect to dashboard
  const isAuthRoute =
    pathname.includes('/login') || pathname.includes('/signup');

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return supabaseResponse;
}
