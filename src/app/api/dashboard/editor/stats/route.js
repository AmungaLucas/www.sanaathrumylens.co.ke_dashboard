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
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [stats] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM blogs WHERE status = 'PENDING_REVIEW') as pending_reviews,
            (SELECT COUNT(*) FROM blogs WHERE status = 'SCHEDULED') as scheduled_posts,
            (SELECT COUNT(*) FROM blogs WHERE WEEK(published_at) = WEEK(NOW()) AND status = 'PUBLISHED') as published_this_week,
            (SELECT COUNT(DISTINCT author_id) FROM blogs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_authors,
            (SELECT COUNT(*) FROM blogs) as total_posts,
            (SELECT COUNT(*) FROM editorial_assignments WHERE status = 'PENDING') as pending_assignments,
            (SELECT COALESCE(AVG(view_count), 0) FROM blogs WHERE status = 'PUBLISHED') as avg_views,
            (SELECT COALESCE(AVG(like_count + comment_count) / NULLIF(view_count, 0) * 100, 0) FROM blogs WHERE status = 'PUBLISHED') as avg_engagement,
            (SELECT COALESCE(SUM(view_count), 0) FROM blogs WHERE MONTH(published_at) = MONTH(NOW()) AND status = 'PUBLISHED') as monthly_views
    `);

    return NextResponse.json(stats);
}