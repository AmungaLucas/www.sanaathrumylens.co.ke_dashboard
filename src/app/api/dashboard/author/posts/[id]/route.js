import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// GET - Fetch a single post by ID
export async function GET(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorId = decoded.userId;

    // Get post
    const posts = await query(`
        SELECT id, title, slug, excerpt, content, featured_image, status, created_at, updated_at
        FROM blogs 
        WHERE id = ? AND author_id = ?
    `, [id, authorId]);

    if (posts.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

    // Get categories for this post
    const categories = await query(`
        SELECT category_id FROM blog_categories WHERE blog_id = ?
    `, [id]);
    post.category_ids = categories.map(c => c.category_id);

    // Get tags for this post
    const tags = await query(`
        SELECT tag_id FROM blog_tags WHERE blog_id = ?
    `, [id]);
    post.tag_ids = tags.map(t => t.tag_id);

    return NextResponse.json(post);
}

// PUT - Update an existing post
export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

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

    // Check if post exists and belongs to author
    const existing = await query('SELECT id FROM blogs WHERE id = ? AND author_id = ?', [id, authorId]);
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if slug already exists for another post
    const slugExists = await query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [slug, id]);
    if (slugExists.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Update post
    await query(`
        UPDATE blogs 
        SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?, status = ?, updated_at = NOW()
        WHERE id = ? AND author_id = ?
    `, [title, slug, excerpt, content, featured_image, status, id, authorId]);

    // Update categories (delete existing, insert new)
    await query('DELETE FROM blog_categories WHERE blog_id = ?', [id]);
    if (category_ids && category_ids.length > 0) {
        for (const categoryId of category_ids) {
            await query('INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [id, categoryId]);
        }
    }

    // Update tags (delete existing, insert new)
    // First, decrement usage counts for old tags
    const oldTags = await query('SELECT tag_id FROM blog_tags WHERE blog_id = ?', [id]);
    for (const oldTag of oldTags) {
        await query('UPDATE tags SET usage_count = usage_count - 1 WHERE id = ?', [oldTag.tag_id]);
    }

    await query('DELETE FROM blog_tags WHERE blog_id = ?', [id]);
    if (tag_ids && tag_ids.length > 0) {
        for (const tagId of tag_ids) {
            await query('INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)', [id, tagId]);
            await query('UPDATE tags SET usage_count = usage_count + 1 WHERE id = ?', [tagId]);
        }
    }

    return NextResponse.json({ success: true });
}

// DELETE - Remove a post
export async function DELETE(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authorId = decoded.userId;

    // Check if post exists and belongs to author
    const existing = await query('SELECT id FROM blogs WHERE id = ? AND author_id = ?', [id, authorId]);
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get tags for this post to decrement usage counts
    const tags = await query('SELECT tag_id FROM blog_tags WHERE blog_id = ?', [id]);
    for (const tag of tags) {
        await query('UPDATE tags SET usage_count = usage_count - 1 WHERE id = ?', [tag.tag_id]);
    }

    // Delete post (cascade will handle blog_categories and blog_tags)
    await query('DELETE FROM blogs WHERE id = ? AND author_id = ?', [id, authorId]);

    return NextResponse.json({ success: true });
}