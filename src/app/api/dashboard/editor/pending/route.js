import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserRole, isAllowed, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    const userRole = getUserRole(decoded);

    if (!userRole || !isAllowed(userRole, ['editor', 'super_admin'])) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const posts = await query(`
        SELECT 
            p.id, p.title, p.slug, p.status, p.created_at,
            u.display_name as author_name, u.slug as author_slug, u.avatar
        FROM posts p
        JOIN users u ON p.author_id = u.id
        WHERE p.status = 'draft'
          AND p.is_deleted = 0
        ORDER BY p.created_at ASC
        LIMIT 20
    `);

    return NextResponse.json(posts);
}
