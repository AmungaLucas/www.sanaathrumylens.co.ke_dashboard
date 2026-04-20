import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `SELECT id, display_name as name, email, slug, avatar as avatar_url, created_at, last_login, bookmarks_count, likes_count, comments_count FROM users WHERE JSON_CONTAINS(roles, '"user"')`;
    const params = [];

    if (search) {
        sql += ` AND (display_name LIKE ? OR email LIKE ? OR slug LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = await query(sql, params);

    return NextResponse.json({ users, total, totalPages, page });
}
