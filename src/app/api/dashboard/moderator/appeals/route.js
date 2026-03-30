import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

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
        // Since there's no dedicated appeals table, query from content_reports
        // and present them as appeals where the reporter is appealing
        let sql = `
            SELECT 
                r.id, r.content_type, r.content_id, r.reason, r.description, r.status,
                r.created_at, r.reviewed_at,
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
            params.push(status.toUpperCase());
        }

        sql += ` ORDER BY r.created_at DESC LIMIT 50`;

        const appeals = await query(sql, params);
        return NextResponse.json(appeals || []);
    } catch (error) {
        console.error('Error fetching appeals:', error);
        return NextResponse.json([]);
    }
}
