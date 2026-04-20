import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        const users = await query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = users[0];

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Parse roles JSON array and determine primary role for the JWT
        let roles = [];
        try {
            roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || []);
        } catch {
            roles = [];
        }

        // Determine primary role from the roles array for JWT token
        // Priority: SUPER_ADMIN > ADMIN > EDITOR > MODERATOR > AUTHOR > user
        const rolePriority = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR', 'AUTHOR'];
        let primaryRole = 'author'; // default fallback
        for (const r of rolePriority) {
            if (roles.includes(r)) {
                primaryRole = r.toLowerCase();
                break;
            }
        }
        // If no admin role found, check for 'user' role
        if (primaryRole === 'author' && !roles.includes('AUTHOR')) {
            if (roles.includes('user')) {
                primaryRole = 'author'; // regular users access author dashboard
            }
        }

        // Generate token with UUID and primary role
        const token = await generateToken(user.id, 'admin', primaryRole);

        await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.display_name,
                email: user.email,
                avatar_url: user.avatar,
                role: primaryRole,
                roles: roles,
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
