import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

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
        const activity = await query(`
            (SELECT 'comment' as type, CONCAT('Comment on: ', p.title) as message, c.created_at
             FROM comments c
             LEFT JOIN posts p ON c.post_id = p.id
             WHERE c.is_deleted = 0
             ORDER BY c.created_at DESC LIMIT 5)
            UNION ALL
            (SELECT 'report' as type, CONCAT('Report on comment #', cr.comment_id) as message, cr.created_at
             FROM comment_reports cr
             ORDER BY cr.created_at DESC LIMIT 5)
            ORDER BY created_at DESC
            LIMIT 15
        `);
        return NextResponse.json(activity || []);
    } catch (error) {
        console.error('Error fetching moderator recent activity:', error);
        return NextResponse.json([]);
    }
}
