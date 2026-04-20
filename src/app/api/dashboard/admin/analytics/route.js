import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let days;
    switch (period) {
        case '7d': days = 7; break;
        case '30d': days = 30; break;
        case '90d': days = 90; break;
        case '1y': days = 365; break;
        default: days = 30;
    }

    // User growth data
    const userGrowth = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as users
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `, [days]);

    // Content performance
    const contentPerformance = await query(`
        SELECT DATE(published_at) as date, SUM(stats_views) as views, SUM(stats_likes) as likes
        FROM posts
        WHERE status = 'published' AND is_deleted = 0 AND published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(published_at)
        ORDER BY date ASC
    `, [days]);

    // Traffic sources - page_views table does not exist, return empty
    const trafficSources = [];

    // Revenue data (placeholder - implement when payments table is added)
    const revenueData = [];

    // Top performing posts
    const topPosts = await query(`
        SELECT p.id, p.title, p.slug, p.stats_views as view_count, p.stats_likes as like_count, p.stats_comments as comment_count, u.display_name as author_name
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published' AND p.is_deleted = 0
        ORDER BY p.stats_views DESC
        LIMIT 10
    `);

    return NextResponse.json({
        userGrowth,
        contentPerformance,
        trafficSources,
        revenueData,
        topPosts,
    });
}
