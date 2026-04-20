import { query } from './db';

// =============================================
// AUTHOR QUERIES
// =============================================

export async function getAuthorStats(authorId) {
    const [stats] = await query(`
    SELECT 
      COUNT(*) as total_posts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
      0 as pending_posts,
      COALESCE(SUM(stats_views), 0) as total_views,
      COALESCE(SUM(stats_likes), 0) as total_likes,
      COALESCE(SUM(stats_comments), 0) as total_comments
    FROM posts 
    WHERE author_id = ?
      AND is_deleted = 0
  `, [authorId]);

    return stats;
}

export async function getAuthorPosts(authorId, limit = 50, offset = 0) {
    return await query(`
    SELECT id, title, slug, status, stats_views as view_count, stats_likes as like_count, stats_comments as comment_count, 
           published_at, created_at, updated_at
    FROM posts 
    WHERE author_id = ?
      AND is_deleted = 0
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [authorId, limit, offset]);
}

export async function getAuthorPerformanceData(authorId, days = 30) {
    return await query(`
    SELECT 
      DATE(published_at) as date,
      COUNT(*) as posts,
      SUM(stats_views) as views,
      SUM(stats_likes) as likes,
      SUM(stats_comments) as comments
    FROM posts 
    WHERE author_id = ? 
      AND status = 'published'
      AND is_deleted = 0
      AND published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(published_at)
    ORDER BY date ASC
  `, [authorId, days]);
}

export async function getTopAuthorPosts(authorId, limit = 5) {
    return await query(`
    SELECT id, title, slug, stats_views as view_count, stats_likes as like_count, stats_comments as comment_count
    FROM posts 
    WHERE author_id = ? AND status = 'published' AND is_deleted = 0
    ORDER BY stats_views DESC
    LIMIT ?
  `, [authorId, limit]);
}

// =============================================
// EDITOR QUERIES
// =============================================

export async function getPendingReviews() {
    return await query(`
    SELECT 
      p.id, p.title, p.slug, p.status, p.created_at,
      u.display_name as author_name, u.slug as author_slug, u.avatar
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.status = 'draft'
      AND p.is_deleted = 0
    ORDER BY p.created_at ASC
  `);
}

// =============================================
// MODERATOR QUERIES
// =============================================

export async function getPendingComments(limit = 50) {
    return await query(`
    SELECT 
      c.*, 
      p.title as post_title, p.slug as post_slug,
      u.display_name, u.avatar
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.status = 'pending'
      AND c.is_deleted = 0
    ORDER BY c.created_at ASC
    LIMIT ?
  `, [limit]);
}

export async function getPendingReports() {
    return await query(`
    SELECT 
      cr.*,
      u.display_name as reporter_name,
      c.content as content_preview
    FROM comment_reports cr
    LEFT JOIN users u ON cr.reporter_id = u.id
    LEFT JOIN comments c ON cr.comment_id = c.id
    WHERE cr.status = 'pending'
    ORDER BY cr.created_at ASC
  `);
}

// =============================================
// ADMIN QUERIES
// =============================================

export async function getPlatformStats() {
    const [stats] = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE JSON_CONTAINS(roles, '"ADMIN"') OR JSON_CONTAINS(roles, '"SUPER_ADMIN"')) as total_admins,
      (SELECT COUNT(*) FROM posts WHERE status = 'published' AND is_deleted = 0) as total_posts,
      (SELECT COUNT(*) FROM comments WHERE status = 'visible' AND is_deleted = 0) as total_comments,
      (SELECT COALESCE(SUM(stats_views), 0) FROM posts WHERE is_deleted = 0) as total_views,
      (SELECT COALESCE(SUM(stats_likes), 0) FROM posts WHERE is_deleted = 0) as total_likes,
      (SELECT COUNT(*) FROM subscribers WHERE is_active = 1) as total_subscribers
  `);
    return stats;
}

export async function getRecentUsers(limit = 10) {
    return await query(`
    SELECT id, display_name as name, email, slug, created_at
    FROM users
    WHERE JSON_CONTAINS(roles, '"user"')
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit]);
}
