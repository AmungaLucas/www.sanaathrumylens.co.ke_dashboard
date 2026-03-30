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
            b.id, b.title, b.slug, b.status, b.created_at,
            a.name as author_name, a.slug as author_slug, a.avatar_url
        FROM blogs b
        JOIN admin_users a ON b.author_id = a.id
        WHERE b.status = 'PENDING_REVIEW'
        ORDER BY b.created_at ASC
        LIMIT 20
    `);

    return NextResponse.json(posts);
}
