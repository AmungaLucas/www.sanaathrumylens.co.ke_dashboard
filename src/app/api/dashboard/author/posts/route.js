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

    let sql = `SELECT id, title, slug, status, stats_views as view_count, stats_likes as like_count, stats_comments as comment_count, created_at 
               FROM posts WHERE author_id = ? AND is_deleted = 0`;
    const params = [authorId];

    if (status && status !== 'all') {
        // Map uppercase status to lowercase enum
        const statusMap = {
            'PUBLISHED': 'published',
            'DRAFT': 'draft',
            'ARCHIVED': 'archived',
        };
        const actualStatus = statusMap[status] || status.toLowerCase();
        sql += ` AND status = ?`;
        params.push(actualStatus);
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
    const { title, slug, excerpt, content, featured_image, status, category_ids, tags } = body;

    // Validate required fields
    if (!title || !slug || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await query('SELECT id FROM posts WHERE slug = ? AND is_deleted = 0', [slug]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Map status to lowercase
    const statusMap = {
        'PUBLISHED': 'published',
        'DRAFT': 'draft',
        'ARCHIVED': 'archived',
    };
    const actualStatus = statusMap[status] || (status ? status.toLowerCase() : 'draft');

    // Build JSON arrays for category_ids and tags
    const categoryIdsJson = category_ids ? JSON.stringify(category_ids) : null;
    const tagsJson = tags ? (Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([tags])) : null;

    // Insert post
    const result = await query(`
        INSERT INTO posts (title, slug, excerpt, content, featured_image, author_id, status, category_ids, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, slug, excerpt || null, content, featured_image || null, authorId, actualStatus, categoryIdsJson, tagsJson]);

    const postId = result.insertId;

    return NextResponse.json({ success: true, id: postId });
}
