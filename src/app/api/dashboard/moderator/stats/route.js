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
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    try {
        const [stats] = await query(`
            SELECT
                (SELECT COUNT(*) FROM comments WHERE status = 'pending' AND is_deleted = 0) as pending_comments,
                (SELECT COUNT(*) FROM comment_reports WHERE status = 'pending') as pending_reports
        `);

        return NextResponse.json({
            pending_comments: stats?.pending_comments || 0,
            pending_reports: stats?.pending_reports || 0,
            active_warnings: 0,
            pending_appeals: 0,
            resolved_today: 0,
            spam_this_week: 0,
        });
    } catch (error) {
        console.error('Error fetching moderator stats:', error);
        return NextResponse.json({
            pending_comments: 0,
            pending_reports: 0,
            active_warnings: 0,
            pending_appeals: 0,
            resolved_today: 0,
            spam_this_week: 0,
        });
    }
}
