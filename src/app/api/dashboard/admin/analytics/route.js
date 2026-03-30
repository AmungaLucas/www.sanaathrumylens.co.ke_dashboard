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
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
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
        FROM public_users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `, [days]);

    // Content performance
    const contentPerformance = await query(`
        SELECT DATE(published_at) as date, SUM(view_count) as views, SUM(like_count) as likes
        FROM blogs
        WHERE status = 'PUBLISHED' AND published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(published_at)
        ORDER BY date ASC
    `, [days]);

    // Traffic sources
    const trafficSources = await query(`
        SELECT 
            CASE 
                WHEN referrer LIKE '%google%' THEN 'Google'
                WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                WHEN referrer LIKE '%twitter%' THEN 'Twitter'
                WHEN referrer LIKE '%linkedin%' THEN 'LinkedIn'
                WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
                ELSE 'Other'
            END as source,
            COUNT(*) as value
        FROM page_views
        WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY source
    `, [days]);

    // Revenue data (placeholder - implement when payments are added)
    let revenueData = [];
    try {
        revenueData = await query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(amount), 0) as revenue
            FROM payments
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `);
    } catch (error) {
        // payments table not yet implemented
        revenueData = [];
    }

    // Top performing posts
    const topPosts = await query(`
        SELECT b.id, b.title, b.slug, b.view_count, b.like_count, b.comment_count, a.name as author_name
        FROM blogs b
        LEFT JOIN admin_users a ON b.author_id = a.id
        WHERE b.status = 'PUBLISHED'
        ORDER BY b.view_count DESC
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