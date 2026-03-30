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

    const allowedRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    try {
        const [stats] = await query(`
            SELECT
                (SELECT COUNT(*) FROM comments WHERE status = 'PENDING') as pending_comments,
                (SELECT COUNT(*) FROM content_reports WHERE status = 'PENDING') as pending_reports,
                (SELECT COUNT(*) FROM content_reports WHERE status = 'PENDING' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as spam_this_week,
                (SELECT COUNT(*) FROM comments WHERE status = 'SPAM' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as spam_this_week
        `);

        return NextResponse.json({
            pending_comments: stats?.pending_comments || 0,
            pending_reports: stats?.pending_reports || 0,
            active_warnings: 0,
            pending_appeals: 0,
            resolved_today: 0,
            spam_this_week: (stats?.spam_this_week || 0) + (stats?.['spam_this_week(2)'] || 0),
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
