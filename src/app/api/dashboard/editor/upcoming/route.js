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
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // posts table does not have a scheduled_for column or 'SCHEDULED' status.
    // Show draft posts that have a published_at date set (intended to be scheduled)
    const posts = await query(`
        SELECT
            p.id, p.title, p.slug, p.status, p.published_at, p.created_at,
            u.display_name as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.status = 'draft'
          AND p.published_at IS NOT NULL
          AND p.published_at >= CURDATE()
          AND p.is_deleted = 0
        ORDER BY p.published_at ASC
        LIMIT ?
    `, [limit]);

    return NextResponse.json(posts);
}
