import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;
    const { name, email, role, password } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (name) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await query(`UPDATE users SET display_name = ?, slug = ? WHERE id = ?`, [name, slug, id]);
    }
    if (email) await query(`UPDATE users SET email = ? WHERE id = ?`, [email, id]);
    if (role) {
        // Update the roles JSON array with the new role
        const roleUpper = role.toUpperCase();
        await query(`UPDATE users SET roles = ? WHERE id = ?`, [JSON.stringify([roleUpper]), id]);
    }
    if (password) {
        const passwordHash = await bcrypt.hash(password, 10);
        await query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
    }

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address)
        VALUES (?, 'ADMIN', 'UPDATE', 'USER', ?, ?)
    `, [decoded.userId, id, request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}

export async function DELETE(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow deleting self
    if (decoded.userId === id) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await query(`DELETE FROM users WHERE id = ?`, [id]);

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, ip_address)
        VALUES (?, 'ADMIN', 'DELETE', 'USER', ?, ?)
    `, [decoded.userId, id, request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}
