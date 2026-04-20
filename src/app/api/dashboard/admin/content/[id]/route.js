import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;
    const { action, type } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (type === 'blog') {
        let newStatus;
        switch (action) {
            case 'publish': newStatus = 'published'; break;
            case 'archive': newStatus = 'archived'; break;
            default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
        await query(`UPDATE posts SET status = ?, updated_at = NOW() WHERE id = ?`, [newStatus, id]);
    } else if (type === 'event') {
        let newStatus;
        switch (action) {
            case 'publish': newStatus = 'published'; break;
            case 'archive': newStatus = 'archived'; break;
            default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
        await query(`UPDATE events SET status = ?, updated_at = NOW() WHERE id = ?`, [newStatus, id]);
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address)
        VALUES (?, 'ADMIN', ?, ?, ?, ?, ?)
    `, [decoded.userId, action, type.toUpperCase(), id, JSON.stringify({ action }), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}
