import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorId = decoded.userId;

    const data = await query(`
        SELECT 
            DATE(published_at) as date,
            COUNT(*) as posts,
            SUM(stats_views) as views,
            SUM(stats_likes) as likes,
            SUM(stats_comments) as comments
        FROM posts 
        WHERE author_id = ? 
            AND status = 'published'
            AND is_deleted = 0
            AND published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(published_at)
        ORDER BY date ASC
    `, [authorId, days]);

    return NextResponse.json(data);
}
