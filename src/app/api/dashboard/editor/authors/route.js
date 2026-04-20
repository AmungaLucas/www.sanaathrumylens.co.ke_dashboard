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
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use the authors table for author profiles, and aggregate post stats
    // The users table stores admin/editor/moderator users. The authors table stores author profiles.
    // We need to join them or just use one source.
    // Let's use users table for admin users with AUTHOR role, and aggregate from posts.

    const authors = await query(`
        SELECT 
            u.id, u.display_name as name, u.email, u.slug, u.avatar as avatar_url,
            COALESCE(pc.cnt, 0) as total_posts,
            COALESCE(pv.cnt, 0) as total_views,
            COALESCE(pl.cnt, 0) as total_likes
        FROM users u
        LEFT JOIN (SELECT author_id, COUNT(*) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pc ON u.id = pc.author_id
        LEFT JOIN (SELECT author_id, SUM(stats_views) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pv ON u.id = pv.author_id
        LEFT JOIN (SELECT author_id, SUM(stats_likes) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pl ON u.id = pl.author_id
        WHERE JSON_CONTAINS(u.roles, '"AUTHOR"') OR JSON_CONTAINS(u.roles, '"ADMIN"') OR JSON_CONTAINS(u.roles, '"SUPER_ADMIN"') OR JSON_CONTAINS(u.roles, '"EDITOR"')
        ORDER BY total_views DESC
    `);

    // Also get authors from the authors table if it has data
    let tableAuthors = [];
    try {
        tableAuthors = await query(`
            SELECT 
                a.id, a.name, a.email, a.slug, a.avatar as avatar_url,
                COALESCE(pc.cnt, 0) as total_posts,
                COALESCE(pv.cnt, 0) as total_views,
                COALESCE(pl.cnt, 0) as total_likes
            FROM authors a
            LEFT JOIN (SELECT author_id, COUNT(*) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pc ON a.id = pc.author_id
            LEFT JOIN (SELECT author_id, SUM(stats_views) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pv ON a.id = pv.author_id
            LEFT JOIN (SELECT author_id, SUM(stats_likes) as cnt FROM posts WHERE is_deleted = 0 GROUP BY author_id) pl ON a.id = pl.author_id
            ORDER BY total_views DESC
        `);
    } catch {
        // authors table may not exist
    }

    // Merge results, preferring authors table entries
    const seen = new Set();
    const merged = [];
    for (const a of tableAuthors) {
        if (!seen.has(a.id)) {
            seen.add(a.id);
            merged.push(a);
        }
    }
    for (const a of authors) {
        if (!seen.has(a.id)) {
            seen.add(a.id);
            merged.push(a);
        }
    }

    // Sort by requested field
    merged.sort((a, b) => {
        const va = a[sort] || 0;
        const vb = b[sort] || 0;
        return vb - va;
    });

    return NextResponse.json(merged);
}
