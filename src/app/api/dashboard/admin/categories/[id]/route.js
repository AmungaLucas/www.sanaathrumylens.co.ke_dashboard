import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRole, isAllowed, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

// GET single category
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

    const categories = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(categories[0]);
}

// PUT update category
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
    const { name, slug, description, is_active } = body;

    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug exists for another category
    const existing = await query('SELECT id FROM categories WHERE slug = ? AND id != ?', [slug, id]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    await query(`
        UPDATE categories 
        SET name = ?, slug = ?, description = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
    `, [name, slug, description || null, is_active !== false, id]);

    return NextResponse.json({ success: true });
}

// DELETE category
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

    await query('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
}
