import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = params;
    const { action } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'MODERATOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const moderatorId = decoded.userId;

    let newStatus;
    switch (action) {
        case 'approve': newStatus = 'APPROVED'; break;
        case 'spam': newStatus = 'SPAM'; break;
        case 'trash': newStatus = 'TRASHED'; break;
        default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await query(`
        UPDATE comments SET status = ?, updated_at = NOW()
        WHERE id = ?
    `, [newStatus, id]);

    await query(`
        INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type)
        VALUES (?, 'COMMENT', ?, ?)
    `, [moderatorId, id, action]);

    return NextResponse.json({ success: true });
}