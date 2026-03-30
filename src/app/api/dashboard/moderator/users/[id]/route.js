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

    const allowedRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        switch (action) {
            case 'warn': {
                // Issue a warning - log the moderation action
                await query(
                    `INSERT INTO moderation_actions (moderator_id, target_type, target_id, action_type)
                    VALUES (?, 'USER', ?, ?)`,
                    [decoded.userId, id, 'WARN']
                );
                return NextResponse.json({ success: true, message: 'Warning issued' });
            }
            case 'suspend': {
                await query(
                    `UPDATE public_users SET status = 'SUSPENDED' WHERE id = ?`,
                    [id]
                );
                return NextResponse.json({ success: true, message: 'User suspended' });
            }
            case 'ban': {
                await query(
                    `UPDATE public_users SET status = 'BANNED' WHERE id = ?`,
                    [id]
                );
                return NextResponse.json({ success: true, message: 'User banned' });
            }
            case 'activate': {
                await query(
                    `UPDATE public_users SET status = 'ACTIVE' WHERE id = ?`,
                    [id]
                );
                return NextResponse.json({ success: true, message: 'User restored' });
            }
            default:
                return NextResponse.json({ error: 'Invalid action. Use: warn, suspend, ban, activate' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
