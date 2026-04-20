import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const activity = await query(`
            (SELECT 'post' as type, CONCAT('New post: ', title) as message, created_at
             FROM posts WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'user' as type, CONCAT('New user: ', display_name) as message, created_at
             FROM users ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'comment' as type, CONCAT('New comment by: ', user_name) as message, created_at
             FROM comments WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'settings' as type, CONCAT('Settings updated') as message, updated_at as created_at
             FROM system_settings ORDER BY updated_at DESC LIMIT 3)
            ORDER BY created_at DESC
            LIMIT 20
        `);

        return NextResponse.json(activity);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        return NextResponse.json([]);
    }
}
