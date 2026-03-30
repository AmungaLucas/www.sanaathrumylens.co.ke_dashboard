import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const settings = await query(`SELECT setting_key, setting_value FROM system_settings`);

    const result = {};
    settings.forEach(s => {
        try {
            const parsed = JSON.parse(s.setting_value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                // Extract the actual value from wrapped formats:
                // {"value": "Sanaa"} → "Sanaa"
                // {"enabled": false} → false
                // {"enabled": false, "message": "..."} → {"enabled": false, "message": "..."} (complex, keep as-is)
                if ('value' in parsed && Object.keys(parsed).length <= 2) {
                    result[s.setting_key] = parsed.value;
                } else if ('enabled' in parsed && Object.keys(parsed).length === 1) {
                    result[s.setting_key] = parsed.enabled;
                } else {
                    result[s.setting_key] = parsed;
                }
            } else {
                result[s.setting_key] = parsed;
            }
        } catch {
            result[s.setting_key] = s.setting_value;
        }
    });

    // Default values if not set
    return NextResponse.json({
        site_name: result.site_name || 'Sanaa Thru My Lens',
        site_description: result.site_description || 'Exploring Kenya\'s creative ecosystem',
        posts_per_page: result.posts_per_page || 12,
        feature_ai_assistant: result.feature_ai_assistant || false,
        feature_advanced_analytics: result.feature_advanced_analytics || false,
        feature_collaboration: result.feature_collaboration ?? true,
        feature_monetization: result.feature_monetization || false,
        maintenance_mode: result.maintenance_mode || false,
        maintenance_message: result.maintenance_message || 'Site under maintenance',
    });
}

export async function PUT(request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const settings = await request.json();

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    for (const [key, value] of Object.entries(settings)) {
        await query(`
            INSERT INTO system_settings (setting_key, setting_value, updated_by, updated_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            setting_value = VALUES(setting_value), updated_by = VALUES(updated_by), updated_at = NOW()
        `, [key, JSON.stringify(value), decoded.userId]);
    }

    await query(`
        INSERT INTO audit_logs (actor_id, actor_type, action, entity_type, new_values, ip_address)
        VALUES (?, 'ADMIN', 'UPDATE', 'SYSTEM_SETTINGS', ?, ?)
    `, [decoded.userId, JSON.stringify(Object.keys(settings)), request.headers.get('x-forwarded-for') || 'unknown']);

    return NextResponse.json({ success: true });
}