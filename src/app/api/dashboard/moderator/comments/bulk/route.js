import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request) {
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
        const { commentIds, action } = await request.json();

        if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
            return NextResponse.json({ error: 'commentIds array is required' }, { status: 400 });
        }

        const validActions = ['approve', 'spam', 'trash'];
        if (!validActions.includes(action)) {
            return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
        }

        const statusMap = {
            approve: 'visible',
            spam: 'hidden',
            trash: 'hidden',
        };
        const newStatus = statusMap[action];

        // Update all comments in a single query using placeholders
        const placeholders = commentIds.map(() => '?').join(',');
        await query(
            `UPDATE comments SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [newStatus, ...commentIds]
        );

        return NextResponse.json({ success: true, count: commentIds.length });
    } catch (error) {
        console.error('Bulk comment action error:', error);
        return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
    }
}
