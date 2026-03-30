import { query } from './db';

// =============================================
// AUTHOR QUERIES
// =============================================

export async function getAuthorStats(authorId) {
    const [stats] = await query(`
    SELECT 
      COUNT(*) as total_posts,
      SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published_posts,
      SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft_posts,
      SUM(CASE WHEN status = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_posts,
      COALESCE(SUM(view_count), 0) as total_views,
      COALESCE(SUM(like_count), 0) as total_likes,
      COALESCE(SUM(comment_count), 0) as total_comments
    FROM blogs 
    WHERE author_id = ?
  `, [authorId]);

    return stats;
}

export async function getAuthorPosts(authorId, limit = 50, offset = 0) {
    return await query(`
    SELECT id, title, slug, status, view_count, like_count, comment_count, 
           published_at, created_at, updated_at
    FROM blogs 
    WHERE author_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [authorId, limit, offset]);
}

export async function getAuthorPerformanceData(authorId, days = 30) {
    return await query(`
    SELECT 
      DATE(published_at) as date,
      COUNT(*) as posts,
      SUM(view_count) as views,
      SUM(like_count) as likes,
      SUM(comment_count) as comments
    FROM blogs 
    WHERE author_id = ? 
      AND status = 'PUBLISHED'
      AND published_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(published_at)
    ORDER BY date ASC
  `, [authorId, days]);
}

export async function getTopAuthorPosts(authorId, limit = 5) {
    return await query(`
    SELECT id, title, slug, view_count, like_count, comment_count
    FROM blogs 
    WHERE author_id = ? AND status = 'PUBLISHED'
    ORDER BY view_count DESC
    LIMIT ?
  `, [authorId, limit]);
}

// =============================================
// EDITOR QUERIES
// =============================================

export async function getPendingReviews() {
    return await query(`
    SELECT 
      b.id, b.title, b.slug, b.status, b.created_at,
      a.name as author_name, a.slug as author_slug, a.avatar_url
    FROM blogs b
    JOIN admin_users a ON b.author_id = a.id
    WHERE b.status = 'PENDING_REVIEW'
    ORDER BY b.created_at ASC
  `);
}

// =============================================
// MODERATOR QUERIES
// =============================================

export async function getPendingComments(limit = 50) {
    return await query(`
    SELECT 
      c.*, 
      b.title as blog_title, b.slug as blog_slug,
      u.name as user_name, u.avatar_url
    FROM comments c
    JOIN blogs b ON c.blog_id = b.id
    LEFT JOIN public_users u ON c.user_id = u.id
    WHERE c.status = 'PENDING'
    ORDER BY c.created_at ASC
    LIMIT ?
  `, [limit]);
}

export async function getPendingReports() {
    return await query(`
    SELECT 
      cr.*,
      u.name as reporter_name,
      CASE 
        WHEN cr.content_type = 'BLOG' THEN (SELECT title FROM blogs WHERE id = cr.content_id)
        WHEN cr.content_type = 'COMMENT' THEN (SELECT content FROM comments WHERE id = cr.content_id)
      END as content_preview
    FROM content_reports cr
    JOIN public_users u ON cr.reporter_id = u.id
    WHERE cr.status = 'PENDING'
    ORDER BY cr.created_at ASC
  `);
}

// =============================================
// ADMIN QUERIES
// =============================================

export async function getPlatformStats() {
    const [stats] = await query(`
    SELECT 
      (SELECT COUNT(*) FROM public_users) as total_users,
      (SELECT COUNT(*) FROM admin_users) as total_admins,
      (SELECT COUNT(*) FROM blogs WHERE status = 'PUBLISHED') as total_posts,
      (SELECT COUNT(*) FROM comments WHERE status = 'APPROVED') as total_comments,
      (SELECT COALESCE(SUM(view_count), 0) FROM blogs) as total_views,
      (SELECT COALESCE(SUM(like_count), 0) FROM blogs) as total_likes,
      (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'ACTIVE') as total_subscribers
  `);
    return stats;
}

export async function getRecentUsers(limit = 10) {
    return await query(`
    SELECT id, name, email, username, created_at, status
    FROM public_users
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit]);
}