import { query } from '@/lib/db';

export async function GET() {
    try {
        const result = await query('SELECT 1 as connected, NOW() as server_time');
        return Response.json({
            success: true,
            message: 'Database connected!',
            serverTime: result[0].server_time
        });
    } catch (error) {
        console.error('DB Test Error:', error);
        return Response.json({
            success: false,
            error: error.message,
            code: error.code
        }, { status: 500 });
    }
}