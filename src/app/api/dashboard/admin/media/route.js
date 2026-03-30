import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateUUID } from '@/lib/uuid';

export async function GET(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 24;
    const offset = (page - 1) * limit;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let sql = `SELECT * FROM media WHERE 1=1`;
    const params = [];

    if (search) {
        sql += ` AND (filename LIKE ? OR original_name LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }

    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as t`;
    const [countResult] = await query(countSql, params);
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const media = await query(sql, params);

    return NextResponse.json({ media, total, totalPages, page });
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const filename = `${generateUUID()}.${extension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, filename);

    try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
    } catch (error) {
        console.error('File write error:', error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }

    const url = `/uploads/${filename}`;
    const fileType = file.type;
    const fileSize = file.size;

    await query(`
        INSERT INTO media (filename, original_name, path, url, type, size, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [filename, originalName, filePath, url, fileType, fileSize, decoded.userId]);

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, new_values, ip_address)
        VALUES (?, 'ADMIN', 'UPLOAD', 'MEDIA', ?, ?)
    `, [decoded.userId, JSON.stringify({ filename, originalName }), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true, url, filename });
}