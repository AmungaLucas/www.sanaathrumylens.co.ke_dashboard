import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active categories
    const categories = await query(`
        SELECT id, name, slug FROM categories 
        WHERE is_active = 1 
        ORDER BY name ASC
    `);

    // tags table does NOT exist in the live database.
    // Tags are stored as JSON in posts.
    const tags = [];

    return NextResponse.json({ categories, tags });
}
