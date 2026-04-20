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
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // users table does not have a status column
        // Log all moderation actions via moderation_actions table
        switch (action) {
            case 'warn': {
                await query(
                    `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type)
                    VALUES (?, 'USER', ?, 'WARN')`,
                    [decoded.userId, id]
                );
                return NextResponse.json({ success: true, message: 'Warning issued' });
            }
            case 'suspend': {
                await query(
                    `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason)
                    VALUES (?, 'USER', ?, 'SUSPEND', 'User suspended by moderator')`,
                    [decoded.userId, id]
                );
                return NextResponse.json({ success: true, message: 'Suspension recorded' });
            }
            case 'ban': {
                await query(
                    `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason)
                    VALUES (?, 'USER', ?, 'BAN', 'User banned by moderator')`,
                    [decoded.userId, id]
                );
                return NextResponse.json({ success: true, message: 'Ban recorded' });
            }
            case 'activate': {
                await query(
                    `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type, reason)
                    VALUES (?, 'USER', ?, 'ACTIVATE', 'User restored by moderator')`,
                    [decoded.userId, id]
                );
                return NextResponse.json({ success: true, message: 'Restoration recorded' });
            }
            default:
                return NextResponse.json({ error: 'Invalid action. Use: warn, suspend, ban, activate' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
