import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const month = parseInt(searchParams.get('month')) || new Date().getMonth() + 1;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // posts table does not have a scheduled_for column.
    // Use published_at for published posts as the scheduled date.
    const posts = await query(`
        SELECT
            p.id, p.title, p.slug, p.status, p.author_id,
            p.published_at as scheduled_date,
            u.display_name as author_name
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.status IN ('published', 'draft')
          AND p.is_deleted = 0
          AND ((p.status = 'published' AND p.published_at IS NOT NULL AND YEAR(p.published_at) = ? AND MONTH(p.published_at) = ?)
            OR (p.status = 'draft'))
        ORDER BY COALESCE(p.published_at, p.created_at) ASC
    `, [year, month]);

    // Add notes from editorial_calendar if they exist
    try {
        for (const post of posts) {
            const [cal] = await query(`SELECT notes FROM editorial_calendar WHERE blog_id = ?`, [post.id]);
            if (cal) post.notes = cal.notes;
        }
    } catch {
        // editorial_calendar table may not exist, continue without notes
    }

    return NextResponse.json(posts);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const body = await request.json();
    const { title, scheduled_date, author_id, notes } = body;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'editor' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!title) {
        return NextResponse.json({ error: 'Missing required fields: title' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const result = await query(`
        INSERT INTO posts (title, slug, status, author_id, published_at, created_at, updated_at)
        VALUES (?, ?, 'draft', ?, ?, NOW(), NOW())
    `, [title, slug, author_id || null, scheduled_date || null]);

    const postId = result.insertId;

    // Add to editorial_calendar if table exists
    if (notes) {
        try {
            await query(`
                INSERT INTO editorial_calendar (blog_id, notes, scheduled_date)
                VALUES (?, ?, ?)
            `, [postId, notes, scheduled_date || null]);
        } catch {
            // editorial_calendar table may not exist, ignore
        }
    }

    return NextResponse.json({ success: true, id: postId });
}
