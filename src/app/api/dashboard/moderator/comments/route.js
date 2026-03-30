import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);

    // Allow MODERATOR, ADMIN, and SUPER_ADMIN
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    try {
        let sql = `
            SELECT 
                c.id, c.content, c.status, c.created_at,
                c.author_name, c.user_id,
                u.avatar_url,
                b.id as blog_id, b.title as blog_title, b.slug as blog_slug,
                p.author_name as reply_to
            FROM comments c
            LEFT JOIN public_users u ON c.user_id = u.id
            LEFT JOIN blogs b ON c.blog_id = b.id
            LEFT JOIN comments p ON c.parent_id = p.id
            WHERE 1=1
        `;
        const params = [];

        if (status !== 'all') {
            sql += ` AND c.status = ?`;
            params.push(status);
        }

        sql += ` ORDER BY c.created_at DESC LIMIT 100`;

        const comments = await query(sql, params);

        // Ensure we always return an array
        return NextResponse.json(comments || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json([]);
    }
}