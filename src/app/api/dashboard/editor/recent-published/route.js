import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 5;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const posts = await query(`
        SELECT
            b.id, b.title, b.slug, b.status, b.published_at, b.created_at,
            b.view_count, b.like_count, b.comment_count,
            a.name as author_name
        FROM blogs b
        JOIN admin_users a ON b.author_id = a.id
        WHERE b.status = 'PUBLISHED'
        ORDER BY b.published_at DESC
        LIMIT ?
    `, [limit]);

    return NextResponse.json(posts);
}
