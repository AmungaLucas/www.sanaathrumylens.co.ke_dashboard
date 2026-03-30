import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRole, isAllowed, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateUUID } from '@/lib/uuid';

// GET tags list
export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userRole = getUserRole(decoded);

    if (!userRole || !isAllowed(userRole, ['admin', 'super_admin'])) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tags = await query(`
        SELECT id, name, slug, description, usage_count, created_at
        FROM tags
        ORDER BY name ASC
    `);

    return NextResponse.json(tags);
}

// POST create tag with UUID
export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userRole = getUserRole(decoded);

    if (!userRole || !isAllowed(userRole, ['admin', 'super_admin'])) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug exists
    const existing = await query('SELECT id FROM tags WHERE slug = ?', [slug]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const tagId = generateUUID();

    await query(`
        INSERT INTO tags (id, name, slug, description)
        VALUES (?, ?, ?, ?)
    `, [tagId, name, slug, description || null]);

    return NextResponse.json({ success: true, id: tagId });
}
