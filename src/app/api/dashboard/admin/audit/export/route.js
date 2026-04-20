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

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `
        SELECT l.created_at, u.display_name as actor_name, l.action, l.entity_type, l.entity_id, l.old_values, l.new_values, l.ip_address
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

    sql += ` ORDER BY l.created_at DESC LIMIT 10000`;

    const logs = await query(sql, params);

    // Generate CSV
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Old Values', 'New Values', 'IP Address'];
    const rows = logs.map(log => [
        log.created_at,
        log.actor_name || 'System',
        log.action,
        log.entity_type,
        log.entity_id,
        log.old_values ? JSON.stringify(log.old_values) : '',
        log.new_values ? JSON.stringify(log.new_values) : '',
        log.ip_address,
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().slice(0, 19)}.csv"`,
        },
    });
}
