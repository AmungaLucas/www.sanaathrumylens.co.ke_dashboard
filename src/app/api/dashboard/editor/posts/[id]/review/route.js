import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = params;
    const { action, feedback, feedback_type } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'EDITOR' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const editorId = decoded.userId;

    let newStatus;
    switch (action) {
        case 'approve':
            newStatus = 'PUBLISHED';
            break;
        case 'changes_requested':
            newStatus = 'CHANGES_REQUESTED';
            break;
        case 'reject':
            newStatus = 'ARCHIVED';
            break;
        default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update post status
    await query(`
        UPDATE blogs 
        SET status = ?, updated_at = NOW()
        WHERE id = ?
    `, [newStatus, id]);

    // Add feedback
    if (feedback) {
        await query(`
            INSERT INTO editorial_feedback (blog_id, sender_id, recipient_id, feedback_type, message)
            VALUES (?, ?, (SELECT author_id FROM blogs WHERE id = ?), ?, ?)
        `, [id, editorId, id, feedback_type || 'GENERAL', feedback]);
    }

    // Log action
    await query(`
        INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason)
        VALUES (?, 'BLOG', ?, ?, ?)
    `, [editorId, id, action, feedback || null]);

    return NextResponse.json({ success: true });
}