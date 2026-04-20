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

    // Allow MODERATOR, ADMIN, and SUPER_ADMIN
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    try {
        let sql = `
            SELECT 
                c.id, c.content, c.status, c.created_at,
                c.user_name, c.user_id, c.user_avatar as avatar_url,
                p.id as post_id, p.title as post_title, p.slug as post_slug,
                parent.user_name as reply_to
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN posts p ON c.post_id = p.id
            LEFT JOIN comments parent ON c.parent_id = parent.id
            WHERE c.is_deleted = 0
        `;
        const params = [];

        if (status !== 'all') {
            // Map uppercase statuses to actual lowercase enum values
            const statusMap = {
                'PENDING': 'pending',
                'APPROVED': 'visible',
                'VISIBLE': 'visible',
                'HIDDEN': 'hidden',
                'SPAM': 'hidden',
                'TRASHED': 'hidden',
            };
            const actualStatus = statusMap[status] || status.toLowerCase();
            sql += ` AND c.status = ?`;
            params.push(actualStatus);
        }

        sql += ` ORDER BY c.created_at DESC LIMIT 100`;

        const comments = await query(sql, params);

        // Ensure we always return an array
        return NextResponse.json(comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json([]);
    }
}
