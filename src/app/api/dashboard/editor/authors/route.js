import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'total_views';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const authors = await query(`
        SELECT 
            id, name, email, slug, avatar_url, author_title, is_verified,
            total_posts, total_views, total_likes, follower_count
        FROM admin_users
        WHERE role IN ('AUTHOR', 'CONTRIBUTOR')
        ORDER BY ${sort} DESC
    `);

    return NextResponse.json(authors);
}