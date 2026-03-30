import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRole, isAllowed, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { generateUUID } from '@/lib/uuid';

// GET categories list
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

    const categories = await query(`
        SELECT
            c.id,
            c.name,
            c.slug,
            c.description,
            c.is_active,
            c.created_at,
            c.updated_at,
            COUNT(bc.blog_id) AS post_count
        FROM categories c
        LEFT JOIN blog_categories bc ON bc.category_id = c.id
        GROUP BY c.id, c.name, c.slug, c.description, c.is_active, c.created_at, c.updated_at
        ORDER BY c.name ASC
    `);

    return NextResponse.json(categories);
}

// POST create category with UUID
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
    const { name, slug, description, is_active } = body;

    if (!name || !slug) {
        return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug exists
    const existing = await query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (existing.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const categoryId = generateUUID();

    await query(`
        INSERT INTO categories (id, name, slug, description, is_active)
        VALUES (?, ?, ?, ?, ?)
    `, [categoryId, name, slug, description || null, is_active !== false]);

    return NextResponse.json({ success: true, id: categoryId });
}
