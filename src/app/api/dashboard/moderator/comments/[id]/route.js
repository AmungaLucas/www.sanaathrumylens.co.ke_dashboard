import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;
    const { action } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'moderator' && decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const moderatorId = decoded.userId;

    // Map actions to actual comment status enum values
    let newStatus;
    switch (action) {
        case 'approve': newStatus = 'visible'; break;
        case 'spam': newStatus = 'hidden'; break;
        case 'trash': newStatus = 'hidden'; break;
        default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await query(`
        UPDATE comments SET status = ?, updated_at = NOW()
        WHERE id = ?
    `, [newStatus, id]);

    // Log moderation action
    try {
        await query(`
            INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type)
            VALUES (?, 'COMMENT', ?, ?)
        `, [moderatorId, id, action.toUpperCase()]);
    } catch {
        // moderation_actions table may not exist, ignore
    }

    return NextResponse.json({ success: true });
}
