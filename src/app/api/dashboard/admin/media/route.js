import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { generateUUID } from '@/lib/uuid';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // media table does not exist in the live database
    // Return empty graceful response
    return NextResponse.json({ media: [], total: 0, totalPages: 0, page: 1 });
}

export async function POST(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'super_admin')) {
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

    // Log audit (media table does not exist, but still log the action)
    try {
        await query(`
            INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, entity_id, new_values, ip_address)
            VALUES (?, 'ADMIN', 'UPLOAD', 'MEDIA', ?, ?, ?)
        `, [decoded.userId, JSON.stringify({ filename, originalName }), request.headers.get('x-forwarded-for') || 'unknown']);
    } catch {
        // audit_logs may not exist, ignore
    }

    return NextResponse.json({ success: true, url, filename });
}

// Import query for audit logging
import { query } from '@/lib/db';
