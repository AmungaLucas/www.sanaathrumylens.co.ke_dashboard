import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        let sql = `
            SELECT 
                u.id, u.display_name as name, u.email, u.slug, u.avatar as avatar_url,
                u.created_at, u.last_login,
                u.bookmarks_count, u.likes_count, u.comments_count
            FROM users u
            WHERE JSON_CONTAINS(u.roles, '"user"')
        `;
        const params = [];

        if (status === 'active') {
            // Users who have been reported or have flagged comments
            sql = `
                SELECT 
                    u.id, u.display_name as name, u.email, u.slug, u.avatar as avatar_url,
                    u.created_at, u.last_login,
                    u.bookmarks_count, u.likes_count, u.comments_count,
                    (SELECT COUNT(*) FROM comment_reports WHERE reported_user_id = u.id AND status = 'pending') as total_reports
                FROM users u
                WHERE JSON_CONTAINS(u.roles, '"user"')
                HAVING total_reports > 0
                ORDER BY u.created_at DESC
                LIMIT 50
            `;
            const users = await query(sql);
            return NextResponse.json(users || []);
        } else {
            sql += ` ORDER BY u.created_at DESC LIMIT 50`;
            const users = await query(sql, params);
            return NextResponse.json(users || []);
        }
    } catch (error) {
        console.error('Error fetching flagged users:', error);
        return NextResponse.json([]);
    }
}
