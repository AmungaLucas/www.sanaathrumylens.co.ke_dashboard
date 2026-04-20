import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [post] = await query(`
        SELECT
            p.*, u.display_name as author_name, u.slug as author_slug, u.avatar as author_avatar
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
    `, [id]);

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse JSON fields
    try {
        post.category_ids = typeof post.category_ids === 'string' ? JSON.parse(post.category_ids) : (post.category_ids || []);
    } catch {
        post.category_ids = [];
    }
    try {
        post.tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : (post.tags || []);
    } catch {
        post.tags = [];
    }

    // Resolve category names from the JSON category_ids array
    if (post.category_ids && post.category_ids.length > 0) {
        try {
            const placeholders = post.category_ids.map(() => '?').join(',');
            const categoryRows = await query(`
                SELECT id, name, slug FROM categories WHERE id IN (${placeholders})
            `, [...post.category_ids]);
            post.categories = categoryRows.map(c => c.name);
        } catch {
            post.categories = [];
        }
    } else {
        post.categories = [];
    }

    // Tags are already parsed from JSON - just use them as string array
    if (!Array.isArray(post.tags)) post.tags = [];

    return NextResponse.json(post);
}
