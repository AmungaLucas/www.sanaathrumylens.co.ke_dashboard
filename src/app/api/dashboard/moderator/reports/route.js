import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        let sql = `
            SELECT 
                r.id, r.content_type, r.content_id, r.reason, r.description, r.status,
                r.created_at, r.reviewed_at, r.reviewed_by,
                r.reporter_id,
                pu.name as reporter_name,
                CASE r.content_type
                    WHEN 'BLOG' THEN (SELECT title FROM blogs WHERE id = r.content_id)
                    WHEN 'COMMENT' THEN (SELECT content FROM comments WHERE id = r.content_id)
                    ELSE 'Unknown Content'
                END as content_title
            FROM content_reports r
            LEFT JOIN public_users pu ON r.reporter_id = pu.id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            sql += ` AND r.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY r.created_at DESC LIMIT 100`;

        const reports = await query(sql, params);
        return NextResponse.json(reports || []);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json([]);
    }
}
