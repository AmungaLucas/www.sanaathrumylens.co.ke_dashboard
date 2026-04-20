import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    try {
        const decoded = await verifyToken(token);
        if (!decoded || decoded.userType !== 'admin') {
            return NextResponse.json({ error: 'Invalid token type' }, { status: 401 });
        }

        const users = await query('SELECT id, display_name as name, email, avatar as avatar_url, roles FROM users WHERE id = ?', [decoded.userId]);

        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        const user = users[0];

        // Parse roles and determine primary role
        let roles = [];
        try {
            roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
        } catch {
            roles = [];
        }

        const rolePriority = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR', 'AUTHOR'];
        let primaryRole = 'author';
        for (const r of rolePriority) {
            if (roles.includes(r)) {
                primaryRole = r.toLowerCase();
                break;
            }
        }

        return NextResponse.json({
            ...user,
            role: primaryRole,
        });
    } catch (error) {
        console.error('Auth me error:', error);
        return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }
}
