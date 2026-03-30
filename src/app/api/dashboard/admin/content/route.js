import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'blog';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql, countSql, params = [];

    if (type === 'blog') {
        sql = `
            SELECT b.id, b.title, b.slug, b.status, b.created_at, b.published_at, b.view_count, b.like_count, b.comment_count,
                   a.name as author_name, a.slug as author_slug
            FROM blogs b
            LEFT JOIN admin_users a ON b.author_id = a.id
            WHERE 1=1
        `;
        if (search) {
            sql += ` AND (b.title LIKE ? OR b.excerpt LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        if (status !== 'all') {
            sql += ` AND b.status = ?`;
            params.push(status);
        }
        countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
        sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    } else {
        sql = `
            SELECT id, title, slug, status, created_at, event_date, location_name, is_online
            FROM events
            WHERE 1=1
        `;
        if (search) {
            sql += ` AND title LIKE ?`;
            params.push(`%${search}%`);
        }
        if (status !== 'all') {
            sql += ` AND status = ?`;
            params.push(status);
        }
        countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
        sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    }

    const [countResult] = await query(countSql, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    params.push(limit, offset);

    const items = await query(sql, params);

    return NextResponse.json({ items, total, totalPages, page });
}