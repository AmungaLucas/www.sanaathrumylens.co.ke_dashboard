import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { unlink } from 'fs/promises';

export async function DELETE(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const media = await query(`SELECT path FROM media WHERE id = ?`, [id]);
    if (media.length > 0 && media[0].path) {
        try {
            await unlink(media[0].path);
        } catch (err) {
            console.error('Failed to delete file:', err);
        }
    }

    await query(`DELETE FROM media WHERE id = ?`, [id]);

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address)
        VALUES (?, 'ADMIN', 'DELETE', 'MEDIA', ?, ?)
    `, [decoded.userId, id, request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}