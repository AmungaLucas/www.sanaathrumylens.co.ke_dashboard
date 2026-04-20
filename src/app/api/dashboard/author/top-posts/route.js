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

    const posts = await query(`
        SELECT id, title, stats_views as view_count, stats_likes as like_count, stats_comments as comment_count
        FROM posts 
        WHERE author_id = ? AND status = 'published' AND is_deleted = 0
        ORDER BY stats_views DESC
        LIMIT 5
    `, [authorId]);

    return NextResponse.json(posts);
}
