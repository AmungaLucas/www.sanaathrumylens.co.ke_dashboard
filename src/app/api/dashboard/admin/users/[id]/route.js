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
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let newStatus;
    switch (action) {
        case 'activate': newStatus = 'ACTIVE'; break;
        case 'suspend': newStatus = 'SUSPENDED'; break;
        case 'ban': newStatus = 'BANNED'; break;
        default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await query(`UPDATE public_users SET status = ? WHERE id = ?`, [newStatus, id]);

    // Log audit
    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address)
        VALUES (?, 'ADMIN', ?, 'USER', ?, ?, ?)
    `, [decoded.userId, action, id, JSON.stringify({ status: newStatus }), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}