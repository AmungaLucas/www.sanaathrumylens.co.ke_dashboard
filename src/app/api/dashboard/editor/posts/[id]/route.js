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
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [post] = await query(`
        SELECT
            b.*, a.name as author_name, a.slug as author_slug, a.avatar_url as author_avatar
        FROM blogs b
        JOIN admin_users a ON b.author_id = a.id
        WHERE b.id = ?
    `, [id]);

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch categories for this post
    try {
        const categories = await query(`
            SELECT c.name, c.slug
            FROM blog_categories bc
            JOIN categories c ON bc.category_id = c.id
            WHERE bc.blog_id = ?
        `, [id]);
        post.categories = categories.map(c => c.name);
    } catch {
        post.categories = [];
    }

    // Fetch tags for this post
    try {
        const tags = await query(`
            SELECT t.name, t.slug
            FROM blog_tags bt
            JOIN tags t ON bt.tag_id = t.id
            WHERE bt.blog_id = ?
        `, [id]);
        post.tags = tags.map(t => t.name);
    } catch {
        post.tags = [];
    }

    return NextResponse.json(post);
}
