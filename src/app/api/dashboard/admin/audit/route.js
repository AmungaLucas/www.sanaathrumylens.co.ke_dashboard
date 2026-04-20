import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const entity = searchParams.get('entity') || '';
    const action = searchParams.get('action') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = (page - 1) * limit;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `
        SELECT l.*, u.display_name as actor_name
        FROM audit_logs l
        LEFT JOIN users u ON l.actor_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (search) {
        sql += ` AND (u.display_name LIKE ? OR l.action LIKE ? OR l.entity_type LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }
    if (entity) {
        sql += ` AND l.entity_type = ?`;
        params.push(entity);
    }
    if (action) {
        sql += ` AND l.action = ?`;
        params.push(action);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = await query(sql, params);

    return NextResponse.json({ logs, total, totalPages, page });
}
