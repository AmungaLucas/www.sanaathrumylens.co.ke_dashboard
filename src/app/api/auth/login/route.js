import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        const users = await query('SELECT * FROM admin_users WHERE email = ?', [email]);

        if (users.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = users[0];

        if (user.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Account is not active' }, { status: 401 });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate token with UUID
        const token = await generateToken(user.id, 'admin', user.role);

        await query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [user.id]);

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                role: user.role,
            },
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}