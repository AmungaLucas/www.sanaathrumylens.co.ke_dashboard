import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateUUID } from '@/lib/uuid';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admins = await query(`
        SELECT id, display_name as name, email, avatar as avatar_url, roles, created_at, last_login
        FROM users
        WHERE JSON_CONTAINS(roles, '"ADMIN"') OR JSON_CONTAINS(roles, '"SUPER_ADMIN"') OR JSON_CONTAINS(roles, '"EDITOR"') OR JSON_CONTAINS(roles, '"MODERATOR"') OR JSON_CONTAINS(roles, '"AUTHOR"')
        ORDER BY created_at DESC
    `);

    return NextResponse.json(admins);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { name, email, role, password } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!name || !email || !password) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await query(`SELECT id FROM users WHERE email = ?`, [email]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateUUID();

    // Build roles JSON array - role param is uppercase like 'AUTHOR', 'EDITOR', etc.
    const roleUpper = (role || 'AUTHOR').toUpperCase();
    const roles = JSON.stringify([roleUpper]);

    await query(`
        INSERT INTO users (id, display_name, email, slug, password_hash, roles, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [id, name, email, slug, passwordHash, roles]);

    // Log audit
    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address)
        VALUES (?, 'ADMIN', 'CREATE', 'USER', ?, ?, ?)
    `, [decoded.userId, id, JSON.stringify({ name, email, role }), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true, id });
}
