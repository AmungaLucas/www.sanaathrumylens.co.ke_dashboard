import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PUT(request, { params }) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const { id } = await params;
    const { action } = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.userType !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedRoles = ['moderator', 'admin', 'super_admin'];
    if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Map to actual comment_reports status enum values
    const statusMap = {
        review: 'reviewed',
        accept: 'reviewed',
        reject: 'dismissed',
    };

    if (!statusMap[action]) {
        return NextResponse.json({ error: 'Invalid action. Use: review, accept, reject' }, { status: 400 });
    }

    try {
        await query(
            `UPDATE comment_reports SET status = ? WHERE id = ?`,
            [statusMap[action], id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error processing appeal:', error);
        return NextResponse.json({ error: 'Failed to process appeal' }, { status: 500 });
    }
}
