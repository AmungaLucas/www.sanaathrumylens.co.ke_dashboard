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
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Note: users table does not have a status column.
    // Use moderation_actions table to track moderation actions.
    const validActions = ['activate', 'suspend', 'ban', 'warn'];
    if (!validActions.includes(action)) {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Log the moderation action (actual suspension/ban would need app-level enforcement)
    await query(`
        INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason)
        VALUES (?, 'USER', ?, ?, ?)
    `, [decoded.userId, id, action.toUpperCase(), `Admin action: ${action}`]);

    // Log audit
    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address)
        VALUES (?, 'ADMIN', ?, 'USER', ?, ?, ?)
    `, [decoded.userId, action, id, JSON.stringify({ action }), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}
