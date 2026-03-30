import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [stats] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM public_users) as total_users,
            (SELECT COUNT(*) FROM admin_users) as total_admins,
            (SELECT COUNT(*) FROM blogs) as total_posts,
            (SELECT COUNT(*) FROM events) as total_events,
            (SELECT COUNT(*) FROM comments) as total_comments,
            (SELECT COALESCE(SUM(view_count), 0) FROM blogs) as total_views,
            (SELECT COALESCE(SUM(like_count), 0) FROM blogs) as total_likes,
            (SELECT COUNT(*) FROM comments WHERE status = 'PENDING') as pending_comments,
            (SELECT COUNT(*) FROM content_reports WHERE status = 'PENDING') as pending_reports
    `);
    // payments and subscriptions tables not yet implemented
    stats.monthly_revenue = 0;
    stats.active_subscriptions = 0;
    return NextResponse.json(stats);
}