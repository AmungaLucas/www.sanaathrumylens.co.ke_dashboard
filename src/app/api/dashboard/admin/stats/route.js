import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [stats] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(roles, '"user"')) as total_users,
            (SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(roles, '"ADMIN"') OR JSON_CONTAINS(roles, '"SUPER_ADMIN"')) as total_admins,
            (SELECT COUNT(*) FROM posts WHERE is_deleted = 0) as total_posts,
            (SELECT COUNT(*) FROM events WHERE is_deleted = 0) as total_events,
            (SELECT COUNT(*) FROM comments WHERE is_deleted = 0) as total_comments,
            (SELECT COALESCE(SUM(stats_views), 0) FROM posts WHERE is_deleted = 0) as total_views,
            (SELECT COALESCE(SUM(stats_likes), 0) FROM posts WHERE is_deleted = 0) as total_likes,
            (SELECT COUNT(*) FROM comments WHERE status = 'pending' AND is_deleted = 0) as pending_comments,
            (SELECT COUNT(*) FROM comment_reports WHERE status = 'pending') as pending_reports
    `);
    // payments and subscriptions tables not yet implemented
    stats.monthly_revenue = 0;
    stats.active_subscriptions = 0;
    return NextResponse.json(stats);
}
