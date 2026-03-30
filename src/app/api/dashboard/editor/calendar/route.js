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
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const posts = await query(`
        SELECT
            b.id, b.title, b.slug, b.status, b.author_id,
            DATE(b.scheduled_for) as scheduled_date,
            b.scheduled_for,
            a.name as author_name
        FROM blogs b
        JOIN admin_users a ON b.author_id = a.id
        WHERE (b.status = 'SCHEDULED' OR b.status = 'PUBLISHED')
          AND b.scheduled_for IS NOT NULL
          AND YEAR(b.scheduled_for) = ?
          AND MONTH(b.scheduled_for) = ?
        ORDER BY b.scheduled_for ASC
    `, [year, month]);

    // Try to add notes from editorial_calendar if table exists
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
    const { title, scheduled_date, author_id, status, notes } = body;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!title || !scheduled_date) {
        return NextResponse.json({ error: 'Missing required fields: title, scheduled_date' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const postStatus = status || 'SCHEDULED';

    const result = await query(`
        INSERT INTO blogs (title, slug, status, author_id, scheduled_for, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, slug, postStatus, author_id || null, scheduled_date]);

    const blogId = result.insertId;

    // Try to add to editorial_calendar if table exists
    if (notes) {
        try {
            await query(`
                INSERT INTO editorial_calendar (blog_id, notes, scheduled_date)
                VALUES (?, ?, ?)
            `, [blogId, notes, scheduled_date]);
        } catch {
            // editorial_calendar table may not exist, ignore
        }
    }

    return NextResponse.json({ success: true, id: blogId });
}
