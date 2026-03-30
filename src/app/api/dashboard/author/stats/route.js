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
            SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_posts,
            SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_posts,
            SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_posts,
            COALESCE(SUM(view_count), 0) as total_views,
            COALESCE(SUM(like_count), 0) as total_likes,
            COALESCE(SUM(comment_count), 0) as total_comments
        FROM blogs 
        WHERE author_id = ?
    `, [authorId]);

    return NextResponse.json(stats);
}