// src/app/api/auth/debug/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    return NextResponse.json({
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        allCookies: Array.from(cookieStore.getAll()).map(c => c.name)
    });
}