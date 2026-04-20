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

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // Use comment_reports table instead of content_reports
        let sql = `
            SELECT 
                cr.id, cr.comment_id, cr.reporter_id, cr.reported_user_id, cr.status, cr.created_at,
                u.display_name as reporter_name,
                c.content as content_preview,
                p.title as post_title
            FROM comment_reports cr
            LEFT JOIN users u ON cr.reporter_id = u.id
            LEFT JOIN comments c ON cr.comment_id = c.id
            LEFT JOIN posts p ON c.post_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            // Map uppercase statuses to actual lowercase enum values
            const statusMap = {
                'PENDING': 'pending',
                'REVIEWED': 'reviewed',
                'DISMISSED': 'dismissed',
                'RESOLVED': 'reviewed',
            };
            const actualStatus = statusMap[status] || status.toLowerCase();
            sql += ` AND cr.status = ?`;
            params.push(actualStatus);
        }

        sql += ` ORDER BY cr.created_at DESC LIMIT 100`;

        const reports = await query(sql, params);
        return NextResponse.json(reports || []);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json([]);
    }
}
