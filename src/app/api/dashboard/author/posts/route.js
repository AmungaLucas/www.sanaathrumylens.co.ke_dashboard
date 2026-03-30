import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// GET - List all posts for the authenticated author
export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorId = decoded.userId;

    let sql = `SELECT id, title, slug, status, view_count, like_count, comment_count, created_at 
               FROM blogs WHERE author_id = ?`;
    const params = [authorId];

    if (status && status !== 'all') {
        sql += ` AND status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const posts = await query(sql, params);
    return NextResponse.json(posts);
}

// POST - Create a new post
export async function POST(request) {
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
    const body = await request.json();
    const { title, slug, excerpt, content, featured_image, status, category_ids, tag_ids } = body;

    // Validate required fields
    if (!title || !slug || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await query('SELECT id FROM blogs WHERE slug = ?', [slug]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Insert post
    const result = await query(`
        INSERT INTO blogs (title, slug, excerpt, content, featured_image, author_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, slug, excerpt, content, featured_image, authorId, status]);

    const blogId = result.insertId;

    // Add categories
    if (category_ids && category_ids.length > 0) {
        for (const categoryId of category_ids) {
            await query('INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blogId, categoryId]);
        }
    }

    // Add tags and update usage count
    if (tag_ids && tag_ids.length > 0) {
        for (const tagId of tag_ids) {
            await query('INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)', [blogId, tagId]);
            await query('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tagId]);
        }
    }

    return NextResponse.json({ success: true, id: blogId });
}