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
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorId = decoded.userId;

    const [stats] = await query(`
        SELECT 
            COUNT(*) as total_posts,
            SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
            SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
            0 as pending_posts,
            COALESCE(SUM(stats_views), 0) as total_views,
            COALESCE(SUM(stats_likes), 0) as total_likes,
            COALESCE(SUM(stats_comments), 0) as total_comments
        FROM posts 
        WHERE author_id = ?
          AND is_deleted = 0
    `, [authorId]);

    return NextResponse.json(stats);
}
