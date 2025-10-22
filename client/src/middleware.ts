import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without authentication
        const authPages = ['/login', '/signup', '/forgot-password'];
        if (authPages.some(page => req.nextUrl.pathname.startsWith(page))) {
          return true;
        }

        // Allow access to public pages
        const publicPages = ['/', '/about', '/api/auth'];
        if (publicPages.some(page => req.nextUrl.pathname.startsWith(page))) {
          return true;
        }

        // For protected routes, require authentication
        const protectedRoutes = ['/profile', '/challenges', '/contests', '/settings', '/onboarding'];
        if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
          return !!token;
        }

        // Default to allowing access
        return true;
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/(?!auth)|_next/static|_next/image|favicon.ico).*)',
  ],
}