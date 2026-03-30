import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    console.log('Auth check - Token exists:', !!token);

    if (!token) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    try {
        const decoded = await verifyToken(token);
        console.log('Token decoded for user:', decoded?.userId);

        if (!decoded || decoded.userType !== 'admin') {
            return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
        }

        const users = await query('SELECT id, name, email, avatar_url, role FROM admin_users WHERE id = ?', [decoded.userId]);

        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        console.log('User role:', users[0].role);

        return NextResponse.json(users[0]);
    } catch (error) {
        console.error('Auth me error:', error);
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }
}