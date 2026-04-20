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
        SELECT id, title, slug, excerpt, content, featured_image, cover_image, status, category_ids, tags, created_at, updated_at
        FROM posts 
        WHERE id = ? AND author_id = ? AND is_deleted = 0
    `, [id, authorId]);

    if (posts.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = posts[0];

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
    const { title, slug, excerpt, content, featured_image, status, category_ids, tags } = body;

    // Validate required fields
    if (!title || !slug || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if post exists and belongs to author
    const existing = await query('SELECT id FROM posts WHERE id = ? AND author_id = ? AND is_deleted = 0', [id, authorId]);
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if slug already exists for another post
    const slugExists = await query('SELECT id FROM posts WHERE slug = ? AND id != ? AND is_deleted = 0', [slug, id]);
    if (slugExists.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Map status to lowercase
    const statusMap = {
        'PUBLISHED': 'published',
        'DRAFT': 'draft',
        'ARCHIVED': 'archived',
    };
    const actualStatus = status ? (statusMap[status] || status.toLowerCase()) : undefined;

    // Build JSON arrays for category_ids and tags
    const categoryIdsJson = category_ids ? JSON.stringify(category_ids) : null;
    const tagsJson = tags ? (Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([tags])) : null;

    // Build dynamic update
    const setClauses = ['title = ?', 'slug = ?', 'excerpt = ?', 'content = ?', 'featured_image = ?', 'updated_at = NOW()'];
    const updateParams = [title, slug, excerpt || null, content, featured_image || null];

    if (actualStatus) {
        setClauses.push('status = ?');
        updateParams.push(actualStatus);
    }
    if (category_ids !== undefined) {
        setClauses.push('category_ids = ?');
        updateParams.push(categoryIdsJson);
    }
    if (tags !== undefined) {
        setClauses.push('tags = ?');
        updateParams.push(tagsJson);
    }

    updateParams.push(id, authorId);

    await query(`
        UPDATE posts 
        SET ${setClauses.join(', ')}
        WHERE id = ? AND author_id = ?
    `, updateParams);

    return NextResponse.json({ success: true });
}

// DELETE - Remove a post (soft delete)
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
    const existing = await query('SELECT id FROM posts WHERE id = ? AND author_id = ? AND is_deleted = 0', [id, authorId]);
    if (existing.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Soft delete
    await query('UPDATE posts SET is_deleted = 1, updated_at = NOW() WHERE id = ? AND author_id = ?', [id, authorId]);

    return NextResponse.json({ success: true });
}
