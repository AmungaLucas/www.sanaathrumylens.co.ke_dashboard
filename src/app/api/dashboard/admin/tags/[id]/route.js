import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRole, isAllowed, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// GET single tag
export async function GET(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userRole = getUserRole(decoded);

    if (!userRole || !isAllowed(userRole, ['admin', 'super_admin'])) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tags = await query('SELECT * FROM tags WHERE id = ?', [id]);
    if (tags.length === 0) {
        return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tags[0]);
}

// PUT update tag
export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

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

    // Check if slug exists for another tag
    const existing = await query('SELECT id FROM tags WHERE slug = ? AND id != ?', [slug, id]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    await query(`
        UPDATE tags 
        SET name = ?, slug = ?, description = ?
        WHERE id = ?
    `, [name, slug, description || null, id]);

    return NextResponse.json({ success: true });
}

// DELETE tag
export async function DELETE(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userRole = getUserRole(decoded);

    if (!userRole || !isAllowed(userRole, ['admin', 'super_admin'])) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query('DELETE FROM tags WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
}
