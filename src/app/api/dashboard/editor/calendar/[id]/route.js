import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;
    const { scheduled_date, title, status, author_id, notes } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (scheduled_date) {
        await query(`UPDATE blogs SET scheduled_for = ? WHERE id = ?`, [scheduled_date, id]);
    }
    if (title) {
        await query(`UPDATE blogs SET title = ?, slug = ? WHERE id = ?`, [title, title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), id]);
    }
    if (status) {
        await query(`UPDATE blogs SET status = ? WHERE id = ?`, [status, id]);
    }
    if (author_id !== undefined) {
        await query(`UPDATE blogs SET author_id = ? WHERE id = ?`, [author_id, id]);
    }
    if (notes !== undefined) {
        try {
            const exists = await query(`SELECT id FROM editorial_calendar WHERE blog_id = ?`, [id]);
            if (exists.length) {
                await query(`UPDATE editorial_calendar SET notes = ? WHERE blog_id = ?`, [notes, id]);
            } else if (notes) {
                await query(`INSERT INTO editorial_calendar (blog_id, notes, scheduled_date) VALUES (?, ?, (SELECT scheduled_for FROM blogs WHERE id = ?))`, [id, notes, id]);
            }
        } catch {
            // editorial_calendar table may not exist, ignore
        }
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
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

    try {
        await query(`DELETE FROM editorial_calendar WHERE blog_id = ?`, [id]);
    } catch {
        // editorial_calendar table may not exist, ignore
    }
    await query(`UPDATE blogs SET status = 'ARCHIVED' WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
}
