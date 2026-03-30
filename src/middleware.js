import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    const publicPaths = ['/login', '/unauthorized', '/debug'];
    if (publicPaths.includes(pathname) || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
    }

    // Protect all dashboard routes
    if (pathname !== '/' && !pathname.startsWith('/_next') && !pathname.includes('.')) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const decoded = await verifyToken(token);

        if (!decoded || decoded.userType !== 'admin') {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }

        // Role-based access control
        const userRole = decoded.role?.toLowerCase();
        const requestedRole = pathname.split('/')[1];

        // Allow access to /author, /editor, /moderator, /admin based on role
        const allowedRoles = ['author', 'editor', 'moderator', 'admin'];

        if (allowedRoles.includes(requestedRole) && userRole !== requestedRole && userRole !== 'super_admin') {
            return NextResponse.redirect(new URL(`/${userRole}`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};