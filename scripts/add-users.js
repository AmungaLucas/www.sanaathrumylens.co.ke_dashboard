const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function addUsers() {
    const connection = await mysql.createConnection({
        host: 'da27.host-ww.net',
        user: 'jobready_blog_Admin',
        password: '030290@Amunga@100%',
        database: 'jobready_blog_db',
        port: 3306,
    });

    const users = [
        {
            email: 'admin@sanaathroughmylens.co.ke',
            name: 'System Administrator',
            slug: 'system-administrator',
            role: 'SUPER_ADMIN',
            password: 'Admin@100%',
        },
        {
            email: 'editor@sanaathroughmylens.co.ke',
            name: 'Content Editor',
            slug: 'content-editor',
            role: 'EDITOR',
            password: 'Editor@100%',
        },
        {
            email: 'moderator@sanaathroughmylens.co.ke',
            name: 'Community Moderator',
            slug: 'community-moderator',
            role: 'MODERATOR',
            password: 'Moderator@100%',
        },
        {
            email: 'author@sanaathroughmylens.co.ke',
            name: 'Content Author',
            slug: 'content-author',
            role: 'AUTHOR',
            password: 'Author@100%',
        },
    ];

    for (const user of users) {
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