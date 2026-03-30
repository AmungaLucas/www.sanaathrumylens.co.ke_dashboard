import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `
        SELECT 
            ea.*, a.name as author_name, b.id as blog_id
        FROM editorial_assignments ea
        JOIN admin_users a ON ea.author_id = a.id
        LEFT JOIN blogs b ON b.id = ea.blog_id
        WHERE 1=1
    `;
    const params = [];

    if (status === 'active') {
        sql += ` AND ea.status IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS')`;
    } else if (status !== 'all') {
        sql += ` AND ea.status = ?`;
        params.push(status);
    }

    sql += ` ORDER BY ea.created_at DESC`;

    const assignments = await query(sql, params);
    return NextResponse.json(assignments);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const body = await request.json();
    const { author_id, topic, description, deadline } = body;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const editorId = decoded.userId;

    if (!author_id || !topic || !deadline) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await query(`
        INSERT INTO editorial_assignments (editor_id, author_id, topic, description, deadline, status)
        VALUES (?, ?, ?, ?, ?, 'PENDING')
    `, [editorId, author_id, topic, description || null, deadline]);

    return NextResponse.json({ success: true, id: result.insertId });
}