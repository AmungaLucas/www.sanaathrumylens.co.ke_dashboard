import bcrypt from 'bcryptjs';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// Convert string secret to crypto key
async function getCryptoKey() {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

// Simple JWT encode/decode for Edge Runtime
function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

export async function generateToken(userId, userType, role) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const payload = {
        userId,  // Now this will be a UUID string
        userType,
        role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),
        iat: Math.floor(Date.now() / 1000)
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const key = await getCryptoKey();
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signatureInput)
    );

    const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export async function verifyToken(token) {
    try {
        const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

        // Verify signature
        const signatureInput = `${encodedHeader}.${encodedPayload}`;
        const encoder = new TextEncoder();
        const key = await getCryptoKey();

        const signature = Uint8Array.from(atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signature,
            encoder.encode(signatureInput)
        );

        if (!isValid) {
            return null;
        }

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (error) {
        console.error('Token verification error:', error.message);
        return null;
    }
}

export function getUserRole(decoded) {
    if (!decoded || decoded.userType !== 'admin') return null;
    return decoded.role?.toLowerCase() || null;
}

export function isAllowed(role, allowedRoles = []) {
    const normalizedRole = role?.toLowerCase();

    if (!normalizedRole) {
        return false;
    }

    return allowedRoles.some((allowedRole) => allowedRole?.toLowerCase() === normalizedRole);
}
