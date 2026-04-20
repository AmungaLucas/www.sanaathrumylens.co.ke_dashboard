-- =============================================
-- SANAA THRU MY LENS - COMPLETE DATABASE SCHEMA
-- =============================================
-- Version: 3.0 (UUID Edition)
-- Engine: InnoDB
-- Charset: utf8mb4_unicode_ci
-- Compatible with: MariaDB 10.2+
-- =============================================
SET
    FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. USER TABLES
-- =============================================
CREATE TABLE public_users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(150),
    avatar_url TEXT,
    status ENUM ('ACTIVE', 'SUSPENDED', 'BANNED') DEFAULT 'ACTIVE',
    password_hash VARCHAR(255),
    email_verified_at DATETIME NULL,
    verification_token VARCHAR(100) NULL,
    verification_token_expires DATETIME NULL,
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    comment_count INT UNSIGNED DEFAULT 0,
    like_count INT UNSIGNED DEFAULT 0,
    bookmark_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at DATETIME,
    last_login_at DATETIME,
    last_login_ip VARCHAR(45),
    INDEX idx_public_users_email (email),
    INDEX idx_public_users_username (username),
    INDEX idx_public_users_status (status),
    INDEX idx_public_users_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE admin_users (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    public_user_id CHAR(36) NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    avatar_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    short_bio VARCHAR(300),
    location VARCHAR(100),
    website VARCHAR(255),
    company VARCHAR(255),
    job_title VARCHAR(255),
    author_title VARCHAR(255),
    years_of_experience SMALLINT UNSIGNED,
    is_featured_author BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    verified_by CHAR(36),
    verification_documents JSON,
    twitter_handle VARCHAR(100),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    instagram_handle VARCHAR(100),
    facebook_url VARCHAR(255),
    youtube_url VARCHAR(255),
    medium_url VARCHAR(255),
    role ENUM (
        'SUPER_ADMIN',
        'ADMIN',
        'EDITOR',
        'MODERATOR',
        'AUTHOR',
        'CONTRIBUTOR'
    ) NOT NULL DEFAULT 'AUTHOR',
    permissions JSON,
    status ENUM (
        'ACTIVE',
        'SUSPENDED',
        'INACTIVE',
        'PENDING_VERIFICATION'
    ) DEFAULT 'PENDING_VERIFICATION',
    total_posts INT UNSIGNED DEFAULT 0,
    total_views BIGINT UNSIGNED DEFAULT 0,
    total_likes BIGINT UNSIGNED DEFAULT 0,
    total_comments_received BIGINT UNSIGNED DEFAULT 0,
    follower_count INT UNSIGNED DEFAULT 0,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at DATETIME,
    last_login_ip VARCHAR(45),
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    language VARCHAR(5) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    created_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active_at DATETIME,
    FOREIGN KEY (public_user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_admin_users_email (email),
    INDEX idx_admin_users_slug (slug),
    INDEX idx_admin_users_role (role),
    INDEX idx_admin_users_status (status),
    INDEX idx_admin_users_featured (is_featured_author),
    INDEX idx_admin_users_verified (is_verified),
    INDEX idx_admin_users_metrics (total_views DESC, total_posts DESC),
    FULLTEXT INDEX idx_admin_users_search (name, bio, author_title, company)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE author_upgrade_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    public_user_id CHAR(36) NOT NULL,
    request_reason TEXT,
    portfolio_url VARCHAR(500),
    experience_description TEXT,
    expertise_areas JSON,
    documents JSON,
    status ENUM (
        'PENDING',
        'REVIEWING',
        'APPROVED',
        'REJECTED',
        'INFORMATION_NEEDED'
    ) DEFAULT 'PENDING',
    reviewed_by CHAR(36),
    review_notes TEXT,
    reviewed_at DATETIME,
    created_admin_user_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (public_user_id) REFERENCES public_users (id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    FOREIGN KEY (created_admin_user_id) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_author_upgrade_public_user (public_user_id),
    INDEX idx_author_upgrade_status (status),
    INDEX idx_author_upgrade_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 2. CONTENT TABLES
-- =============================================
CREATE TABLE blogs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT,
    featured_image TEXT,
    featured_image_alt VARCHAR(255),
    author_id CHAR(36),
    co_authors JSON,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    canonical_url VARCHAR(255),
    status ENUM (
        'DRAFT',
        'PENDING_REVIEW',
        'PUBLISHED',
        'SCHEDULED',
        'ARCHIVED'
    ) DEFAULT 'DRAFT',
    published_at DATETIME,
    scheduled_for DATETIME NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_editors_pick BOOLEAN DEFAULT FALSE,
    is_sticky BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    view_count INT UNSIGNED DEFAULT 0,
    like_count INT UNSIGNED DEFAULT 0,
    comment_count INT UNSIGNED DEFAULT 0,
    share_count INT UNSIGNED DEFAULT 0,
    bookmark_count INT UNSIGNED DEFAULT 0,
    reading_time_minutes SMALLINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_blogs_slug (slug),
    INDEX idx_blogs_status_published (status, published_at),
    INDEX idx_blogs_author (author_id),
    INDEX idx_blogs_featured (is_featured, published_at),
    INDEX idx_blogs_editors_pick (is_editors_pick, published_at),
    INDEX idx_blogs_views (view_count),
    INDEX idx_blogs_created (created_at),
    FULLTEXT INDEX idx_blogs_search (title, content, excerpt)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE blog_revisions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    author_id CHAR(36),
    title VARCHAR(255),
    content LONGTEXT,
    excerpt TEXT,
    featured_image TEXT,
    revision_message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_blog_revisions_blog (blog_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE blog_collaborators (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    author_id CHAR(36) NOT NULL,
    contribution_type ENUM ('CO_AUTHOR', 'EDITOR', 'REVIEWER', 'CONTRIBUTOR') DEFAULT 'CO_AUTHOR',
    contribution_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    UNIQUE KEY unique_blog_collaboration (blog_id, author_id),
    INDEX idx_blog_collaborators_blog (blog_id),
    INDEX idx_blog_collaborators_author (author_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 3. CATEGORIES & TAGS
-- =============================================
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    parent_id CHAR(36) NULL,
    featured_image TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_active (is_active),
    FULLTEXT INDEX idx_categories_search (name, description)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE blog_categories (
    blog_id CHAR(36) NOT NULL,
    category_id CHAR(36) NOT NULL,
    PRIMARY KEY (blog_id, category_id),
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE,
    INDEX idx_blog_categories_category (category_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE tags (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    usage_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tags_slug (slug),
    INDEX idx_tags_usage (usage_count),
    FULLTEXT INDEX idx_tags_search (name)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE blog_tags (
    blog_id CHAR(36) NOT NULL,
    tag_id CHAR(36) NOT NULL,
    PRIMARY KEY (blog_id, tag_id),
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
    INDEX idx_blog_tags_tag (tag_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 4. COMMENT SYSTEM
-- =============================================
CREATE TABLE comments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    user_id CHAR(36) NULL,
    parent_id CHAR(36) NULL,
    author_name VARCHAR(150) NOT NULL,
    author_email VARCHAR(255),
    author_website VARCHAR(255),
    author_ip VARCHAR(45),
    author_user_agent TEXT,
    content TEXT NOT NULL,
    status ENUM ('PENDING', 'APPROVED', 'SPAM', 'TRASHED') DEFAULT 'PENDING',
    like_count INT UNSIGNED DEFAULT 0,
    depth TINYINT UNSIGNED DEFAULT 0,
    thread_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at DATETIME NULL,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE,
    INDEX idx_comments_blog_status (blog_id, status),
    INDEX idx_comments_user (user_id),
    INDEX idx_comments_parent (parent_id),
    INDEX idx_comments_thread (thread_path),
    INDEX idx_comments_created (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE comment_likes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    comment_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_comment_like (comment_id, user_id),
    FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE CASCADE,
    INDEX idx_comment_likes_comment (comment_id),
    INDEX idx_comment_likes_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 5. ENGAGEMENT TABLES
-- =============================================
CREATE TABLE blog_likes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_blog_like (blog_id, user_id),
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE CASCADE,
    INDEX idx_blog_likes_blog (blog_id),
    INDEX idx_blog_likes_user (user_id),
    INDEX idx_blog_likes_blog_user (blog_id, user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE blog_saves (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_blog_save (blog_id, user_id),
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE CASCADE,
    INDEX idx_blog_saves_user (user_id),
    INDEX idx_blog_saves_blog (blog_id),
    INDEX idx_blog_saves_user_created (user_id, created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE author_followers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    author_id CHAR(36) NOT NULL,
    follower_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_author_follow (author_id, follower_id),
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    FOREIGN KEY (follower_id) REFERENCES public_users (id) ON DELETE CASCADE,
    INDEX idx_author_followers_author (author_id),
    INDEX idx_author_followers_follower (follower_id),
    INDEX idx_author_followers_author_created (author_id, created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 6. AUTHOR PROFILE DETAILS
-- =============================================
CREATE TABLE author_specialties (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    author_id CHAR(36) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    expertise_level ENUM (
        'BEGINNER',
        'INTERMEDIATE',
        'EXPERT',
        'INDUSTRY_LEADER'
    ) DEFAULT 'EXPERT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    UNIQUE KEY unique_author_specialty (author_id, specialty),
    INDEX idx_author_specialties_author (author_id),
    INDEX idx_author_specialties_specialty (specialty)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE author_education (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    author_id CHAR(36) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    field_of_study VARCHAR(255),
    start_year YEAR,
    end_year YEAR,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_author_education_author (author_id),
    INDEX idx_author_education_author_year (author_id, end_year DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE author_experience (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    author_id CHAR(36) NOT NULL,
    company VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_author_experience_author (author_id),
    INDEX idx_author_experience_author_current (author_id, is_current DESC, end_date DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 7. EVENTS SYSTEM
-- =============================================
CREATE TABLE events (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    excerpt TEXT,
    featured_image TEXT,
    event_date DATETIME NOT NULL,
    event_end_date DATETIME,
    location_name VARCHAR(255),
    location_address TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    online_url VARCHAR(255),
    organizer_name VARCHAR(255),
    organizer_email VARCHAR(255),
    organizer_website VARCHAR(255),
    capacity INT UNSIGNED,
    attendees_count INT UNSIGNED DEFAULT 0,
    status ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'POSTPONED') DEFAULT 'DRAFT',
    is_featured BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME,
    INDEX idx_events_slug (slug),
    INDEX idx_events_date (event_date),
    INDEX idx_events_status (status),
    INDEX idx_events_featured (is_featured),
    INDEX idx_events_upcoming (event_date ASC, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE event_attendees (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    event_id CHAR(36) NOT NULL,
    user_id CHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status ENUM ('GOING', 'INTERESTED', 'NOT_GOING') DEFAULT 'GOING',
    guests_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_attendee (event_id, email),
    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    INDEX idx_event_attendees_event (event_id),
    INDEX idx_event_attendees_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 8. NEWSLETTER & COMMUNICATION
-- =============================================
CREATE TABLE newsletter_subscribers (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150),
    user_id CHAR(36) NULL,
    status ENUM ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED') DEFAULT 'ACTIVE',
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    INDEX idx_newsletter_subscribers_email (email),
    INDEX idx_newsletter_subscribers_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE contact_submissions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_submissions_email (email),
    INDEX idx_contact_submissions_read (is_read),
    INDEX idx_contact_submissions_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    user_id CHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    content TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_notifications_user_read (user_id, is_read, created_at DESC),
    INDEX idx_notifications_type (type, created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 9. LEGAL & COMPLIANCE
-- =============================================
CREATE TABLE cookie_consents (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    user_id CHAR(36) NULL,
    visitor_id VARCHAR(100),
    consent_version VARCHAR(10) NOT NULL,
    necessary BOOLEAN DEFAULT TRUE,
    functional BOOLEAN DEFAULT FALSE,
    analytics BOOLEAN DEFAULT FALSE,
    marketing BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    consent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    INDEX idx_cookie_consents_visitor (visitor_id, consent_date DESC),
    INDEX idx_cookie_consents_user (user_id, consent_date DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE content_reports (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    reporter_id CHAR(36) NOT NULL,
    content_type ENUM ('BLOG', 'COMMENT') NOT NULL,
    content_id CHAR(36) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED') DEFAULT 'PENDING',
    reviewed_by CHAR(36),
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (reporter_id) REFERENCES public_users (id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_content_reports_content (content_type, content_id),
    INDEX idx_content_reports_status (status),
    INDEX idx_content_reports_reporter (reporter_id, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 10. AUTHENTICATION
-- =============================================
CREATE TABLE user_sessions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    user_id CHAR(36) NOT NULL,
    user_type ENUM ('public', 'admin') NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_sessions_token (session_token),
    INDEX idx_user_sessions_user (user_id, expires_at),
    INDEX idx_user_sessions_expires (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE password_reset_tokens (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    user_id CHAR(36) NOT NULL,
    user_type ENUM ('public', 'admin') NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_tokens_token (token),
    INDEX idx_password_reset_tokens_user (user_id, expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE login_attempts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    email VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    was_successful BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_attempts_ip (ip_address, created_at DESC),
    INDEX idx_login_attempts_email (email, created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 11. SEO & REDIRECTS
-- =============================================
CREATE TABLE redirects (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    from_url VARCHAR(500) NOT NULL UNIQUE,
    to_url VARCHAR(500) NOT NULL,
    redirect_type ENUM ('301', '302') DEFAULT '301',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_redirects_from_url (from_url)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 12. MEDIA MANAGEMENT
-- =============================================
CREATE TABLE media (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(100),
    size INT UNSIGNED,
    width INT UNSIGNED,
    height INT UNSIGNED,
    alt_text VARCHAR(255),
    caption TEXT,
    uploaded_by CHAR(36),
    usage_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_media_type (type),
    INDEX idx_media_uploaded_by (uploaded_by),
    INDEX idx_media_usage (usage_count DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 13. ANALYTICS
-- =============================================
CREATE TABLE page_views (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NULL,
    url VARCHAR(500) NOT NULL,
    user_id CHAR(36) NULL,
    visitor_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer VARCHAR(500),
    device_type ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'BOT'),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    INDEX idx_page_views_blog (blog_id),
    INDEX idx_page_views_date (viewed_at),
    INDEX idx_page_views_visitor (visitor_id),
    INDEX idx_page_views_blog_date (blog_id, viewed_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE search_queries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    query VARCHAR(255) NOT NULL,
    user_id CHAR(36) NULL,
    results_count INT UNSIGNED,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES public_users (id) ON DELETE SET NULL,
    INDEX idx_search_queries_query (query (100)),
    INDEX idx_search_queries_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 14. AUTHOR ACTIVITY
-- =============================================
CREATE TABLE author_activity (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    author_id CHAR(36) NOT NULL,
    activity_type ENUM (
        'POST_PUBLISHED',
        'COMMENT',
        'LIKE',
        'FOLLOWER',
        'ACHIEVEMENT'
    ) NOT NULL,
    reference_id CHAR(36),
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_author_activity_author (author_id, created_at DESC),
    INDEX idx_author_activity_type (activity_type, created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 15. AUDIT & ADMIN LOGGING
-- =============================================
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    actor_id CHAR(36),
    actor_type VARCHAR(50) NOT NULL COMMENT 'ADMIN, MODERATOR, SYSTEM',
    action VARCHAR(100) NOT NULL COMMENT 'UPDATE, DELETE, activate, suspend, ban, etc.',
    entity_type VARCHAR(100) NOT NULL COMMENT 'USER, BLOG, COMMENT, SYSTEM_SETTINGS, etc.',
    entity_id CHAR(36) NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_audit_logs_actor (actor_id),
    INDEX idx_audit_logs_entity (entity_type, entity_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 16. SYSTEM SETTINGS (KEY-VALUE STORE)
-- =============================================
CREATE TABLE system_settings (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_by CHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users (id) ON DELETE SET NULL,
    INDEX idx_system_settings_key (setting_key),
    INDEX idx_system_settings_updated (updated_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 17. MODERATION ACTIONS
-- =============================================
CREATE TABLE moderation_actions (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    moderator_id CHAR(36) NOT NULL,
    target_type VARCHAR(50) NOT NULL COMMENT 'COMMENT, BLOG, USER',
    target_id CHAR(36) NOT NULL,
    action_type VARCHAR(50) NOT NULL COMMENT 'approve, spam, trash, reject, changes_requested',
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moderator_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_moderation_actions_moderator (moderator_id),
    INDEX idx_moderation_actions_target (target_type, target_id),
    INDEX idx_moderation_actions_type (action_type),
    INDEX idx_moderation_actions_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 18. EDITORIAL FEEDBACK
-- =============================================
CREATE TABLE editorial_feedback (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL,
    sender_id CHAR(36) NOT NULL COMMENT 'Editor who sends feedback',
    recipient_id CHAR(36) NOT NULL COMMENT 'Author who receives feedback',
    feedback_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL' COMMENT 'GENERAL, CONTENT, STYLE, STRUCTURE, SEO',
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    INDEX idx_editorial_feedback_blog (blog_id),
    INDEX idx_editorial_feedback_sender (sender_id),
    INDEX idx_editorial_feedback_recipient (recipient_id),
    INDEX idx_editorial_feedback_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 19. EDITORIAL ASSIGNMENTS
-- =============================================
CREATE TABLE editorial_assignments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    editor_id CHAR(36) NOT NULL COMMENT 'Editor who assigned the task',
    author_id CHAR(36) NOT NULL COMMENT 'Author assigned to write',
    blog_id CHAR(36) NULL COMMENT 'Linked blog once created',
    topic VARCHAR(255) NOT NULL,
    description TEXT NULL,
    deadline DATE NOT NULL,
    status ENUM (
        'PENDING',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (editor_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES admin_users (id) ON DELETE CASCADE,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE SET NULL,
    INDEX idx_editorial_assignments_editor (editor_id),
    INDEX idx_editorial_assignments_author (author_id),
    INDEX idx_editorial_assignments_blog (blog_id),
    INDEX idx_editorial_assignments_status (status),
    INDEX idx_editorial_assignments_deadline (deadline),
    INDEX idx_editorial_assignments_created (created_at DESC)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 20. EDITORIAL CALENDAR
-- =============================================
CREATE TABLE editorial_calendar (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID ()),
    blog_id CHAR(36) NOT NULL UNIQUE,
    notes TEXT NULL,
    scheduled_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (blog_id) REFERENCES blogs (id) ON DELETE CASCADE,
    INDEX idx_editorial_calendar_blog (blog_id),
    INDEX idx_editorial_calendar_date (scheduled_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================
-- 21. VIEWS
-- =============================================
-- Unified Users View
CREATE
OR REPLACE VIEW unified_users AS
SELECT
    id,
    email,
    name,
    avatar_url,
    'public' AS user_type,
    status,
    created_at,
    NULL AS role
FROM
    public_users
UNION ALL
SELECT
    id,
    email,
    name,
    avatar_url,
    'admin' AS user_type,
    status,
    created_at,
    role
FROM
    admin_users;

-- Author Profiles View (Working Version)
CREATE
OR REPLACE VIEW author_profiles AS
SELECT
    a.id,
    a.name,
    a.slug,
    a.avatar_url,
    a.cover_image_url,
    a.bio,
    a.short_bio,
    a.location,
    a.author_title,
    a.is_verified,
    a.is_featured_author,
    a.twitter_handle,
    a.linkedin_url,
    a.github_url,
    a.instagram_handle,
    a.total_posts,
    a.total_views,
    a.total_likes,
    a.follower_count,
    a.created_at,
    (
        SELECT
            JSON_ARRAYAGG (
                JSON_OBJECT (
                    'specialty',
                    s.specialty,
                    'level',
                    s.expertise_level
                )
            )
        FROM
            author_specialties s
        WHERE
            s.author_id = a.id
    ) AS specialties,
    (
        SELECT
            JSON_ARRAYAGG (
                JSON_OBJECT (
                    'institution',
                    e.institution,
                    'degree',
                    e.degree,
                    'field_of_study',
                    e.field_of_study,
                    'year',
                    e.end_year,
                    'is_current',
                    e.is_current
                )
            )
        FROM
            author_education e
        WHERE
            e.author_id = a.id
        ORDER BY
            e.end_year DESC
        LIMIT
            3
    ) AS education,
    (
        SELECT
            JSON_ARRAYAGG (
                JSON_OBJECT (
                    'company',
                    ex.company,
                    'title',
                    ex.job_title,
                    'location',
                    ex.location,
                    'start_date',
                    ex.start_date,
                    'end_date',
                    ex.end_date,
                    'current',
                    ex.is_current
                )
            )
        FROM
            author_experience ex
        WHERE
            ex.author_id = a.id
        ORDER BY
            ex.is_current DESC,
            ex.end_date DESC
        LIMIT
            3
    ) AS experience
FROM
    admin_users a
WHERE
    a.status = 'ACTIVE'
    AND a.role IN ('AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN');

-- Author Dashboard View
CREATE
OR REPLACE VIEW author_dashboard AS
SELECT
    a.id AS author_id,
    a.name,
    a.slug,
    a.avatar_url,
    a.author_title,
    a.is_verified,
    a.is_featured_author,
    COUNT(DISTINCT b.id) AS total_posts,
    COUNT(
        DISTINCT CASE
            WHEN b.status = 'DRAFT' THEN b.id
        END
    ) AS draft_posts,
    COUNT(
        DISTINCT CASE
            WHEN b.status = 'PENDING_REVIEW' THEN b.id
        END
    ) AS pending_posts,
    COUNT(
        DISTINCT CASE
            WHEN b.status = 'SCHEDULED' THEN b.id
        END
    ) AS scheduled_posts,
    COALESCE(SUM(b.view_count), 0) AS total_views,
    COALESCE(SUM(b.like_count), 0) AS total_likes,
    COALESCE(SUM(b.comment_count), 0) AS total_comments,
    COALESCE(
        SUM(
            CASE
                WHEN b.published_at >= DATE_SUB (NOW (), INTERVAL 30 DAY) THEN b.view_count
                ELSE 0
            END
        ),
        0
    ) AS views_last_30d,
    COALESCE(
        SUM(
            CASE
                WHEN b.published_at >= DATE_SUB (NOW (), INTERVAL 30 DAY) THEN b.like_count
                ELSE 0
            END
        ),
        0
    ) AS likes_last_30d,
    COALESCE(
        SUM(
            CASE
                WHEN b.published_at >= DATE_SUB (NOW (), INTERVAL 30 DAY) THEN b.comment_count
                ELSE 0
            END
        ),
        0
    ) AS comments_last_30d,
    COUNT(DISTINCT af.follower_id) AS total_followers,
    COUNT(
        DISTINCT CASE
            WHEN af.created_at >= DATE_SUB (NOW (), INTERVAL 30 DAY) THEN af.follower_id
        END
    ) AS new_followers_last_30d,
    (
        SELECT
            JSON_OBJECT (
                'title',
                b2.title,
                'slug',
                b2.slug,
                'views',
                b2.view_count,
                'published_at',
                b2.published_at
            )
        FROM
            blogs b2
        WHERE
            b2.author_id = a.id
            AND b2.status = 'PUBLISHED'
        ORDER BY
            b2.view_count DESC
        LIMIT
            1
    ) AS top_post
FROM
    admin_users a
    LEFT JOIN blogs b ON b.author_id = a.id
    LEFT JOIN author_followers af ON af.author_id = a.id
WHERE
    a.status = 'ACTIVE'
    AND a.role IN ('AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN')
GROUP BY
    a.id;

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
-- Version: 3.1 (UUID Edition — 6 new operational tables added)
-- Tables: 36+
-- Views: 3
-- Compatible with: MariaDB 10.2+
-- All primary keys use UUID() with default
-- New tables: audit_logs, system_settings, moderation_actions,
--             editorial_feedback, editorial_assignments, editorial_calendar
-- =============================================
SET
    FOREIGN_KEY_CHECKS = 1;