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
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [stats] = await query(`
        SELECT 
            (SELECT COUNT(*) FROM posts WHERE status = 'draft' AND is_deleted = 0) as pending_reviews,
            (SELECT COUNT(*) FROM posts WHERE status = 'draft' AND published_at IS NOT NULL AND is_deleted = 0) as scheduled_posts,
            (SELECT COUNT(*) FROM posts WHERE WEEK(published_at) = WEEK(NOW()) AND status = 'published' AND is_deleted = 0) as published_this_week,
            (SELECT COUNT(DISTINCT author_id) FROM posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_deleted = 0) as active_authors,
            (SELECT COUNT(*) FROM posts WHERE is_deleted = 0) as total_posts,
            (SELECT COUNT(*) FROM editorial_assignments WHERE status = 'PENDING') as pending_assignments,
            (SELECT COALESCE(AVG(stats_views), 0) FROM posts WHERE status = 'published' AND is_deleted = 0) as avg_views,
            (SELECT COALESCE(AVG(stats_likes + stats_comments) / NULLIF(stats_views, 0) * 100, 0) FROM posts WHERE status = 'published' AND is_deleted = 0) as avg_engagement,
            (SELECT COALESCE(SUM(stats_views), 0) FROM posts WHERE MONTH(published_at) = MONTH(NOW()) AND status = 'published' AND is_deleted = 0) as monthly_views
    `);

    return NextResponse.json(stats);
}
