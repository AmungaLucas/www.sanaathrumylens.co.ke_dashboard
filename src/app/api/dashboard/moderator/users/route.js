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

    const allowedRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        let sql, params;

        if (status === 'active') {
            // Users with active warnings or flagged status
            sql = `
                SELECT 
                    u.id, u.name, u.email, u.username, u.avatar_url, u.status,
                    u.created_at,
                    (SELECT COUNT(*) FROM content_reports WHERE reporter_id = u.id AND status = 'PENDING') as total_reports,
                    (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND status = 'SPAM') as spam_comments
                FROM public_users u
                WHERE u.status IN ('ACTIVE', 'SUSPENDED', 'BANNED')
                HAVING total_reports > 0 OR spam_comments > 0
                ORDER BY u.created_at DESC
                LIMIT 50
            `;
            const users = await query(sql);
            return NextResponse.json(users || []);
        } else {
            sql = `
                SELECT 
                    u.id, u.name, u.email, u.username, u.avatar_url, u.status,
                    u.created_at, u.last_login_at,
                    u.comment_count, u.like_count, u.bookmark_count,
                    (SELECT COUNT(*) FROM content_reports WHERE reporter_id = u.id) as total_reports,
                    (SELECT COUNT(*) FROM comments WHERE user_id = u.id AND status = 'SPAM') as spam_comments
                FROM public_users u
                WHERE 1=1
            `;
            if (status === 'suspended') {
                sql += ` AND u.status = 'SUSPENDED'`;
            } else if (status === 'banned') {
                sql += ` AND u.status = 'BANNED'`;
            }
            sql += ` ORDER BY u.created_at DESC LIMIT 50`;
            params = [];
            const users = await query(sql, params);
            return NextResponse.json(users || []);
        }
    } catch (error) {
        console.error('Error fetching flagged users:', error);
        return NextResponse.json([]);
    }
}
