const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function addUsers() {
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;
    const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;

    if (!dbHost || !dbUser || !dbPassword || !dbName) {
        console.error('Missing required environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
        process.exit(1);
    }

    const connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        port: dbPort,
    });

    const users = [
        {
            email: 'admin@sanaathroughmylens.co.ke',
            name: 'System Administrator',
            slug: 'system-administrator',
            role: 'SUPER_ADMIN',
            password: process.env.ADMIN_PASSWORD,
        },
        {
            email: 'editor@sanaathroughmylens.co.ke',
            name: 'Content Editor',
            slug: 'content-editor',
            role: 'EDITOR',
            password: process.env.EDITOR_PASSWORD,
        },
        {
            email: 'moderator@sanaathroughmylens.co.ke',
            name: 'Community Moderator',
            slug: 'community-moderator',
            role: 'MODERATOR',
            password: process.env.MODERATOR_PASSWORD,
        },
        {
            email: 'author@sanaathroughmylens.co.ke',
            name: 'Content Author',
            slug: 'content-author',
            role: 'AUTHOR',
            password: process.env.AUTHOR_PASSWORD,
        },
    ];

    for (const user of users) {
        if (!user.password) {
            console.error(`Missing password environment variable for ${user.role} (${user.email})`);
            continue;
        }

        const password_hash = await bcrypt.hash(user.password, 10);

        await connection.execute(
            `INSERT INTO admin_users (email, name, slug, role, status, password_hash, is_verified, created_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE 
       password_hash = VALUES(password_hash),
       status = 'ACTIVE'`,
            [user.email, user.name, user.slug, user.role, password_hash]
        );

        console.log(`✅ Added/Updated: ${user.email} (${user.role})`);
    }

    await connection.end();
    console.log('Done!');
}

addUsers().catch(console.error);
