#!/usr/bin/env python3
"""
Script to create 6 missing database tables for the Sanaa Thru My Lens project.
Tables: audit_logs, system_settings, moderation_actions, editorial_feedback,
        editorial_assignments, editorial_calendar

Note: The actual database uses INT auto-increment PKs (not CHAR(36) UUIDs).
The schema.sql references tables like admin_users/blogs that don't exist in
the live DB, so FK constraints are omitted to avoid errors.
"""

import mysql.connector
from mysql.connector import Error

DB_CONFIG = {
    'host': 'vda7300.is.cc',
    'user': 'trustfit_sanaa_db_admin',
    'password': 'Amush@100%',
    'database': 'trustfit_sanaa_db',
    'ssl_disabled': True,
}

# Each DDL matches the existing DB convention: INT AUTO_INCREMENT PKs,
# DATETIME with CURRENT_TIMESTAMP defaults, no FK constraints to
# non-existent tables (admin_users, blogs, public_users).
TABLES = [
    # =========================================================
    # 1. audit_logs
    # Used by: admin/settings (PUT), admin/users/[id] (PUT),
    #          admin/audit (GET), admin/audit/export (GET)
    # SELECTs: l.*, a.name, l.created_at, l.action, l.entity_type,
    #          l.entity_id, l.old_values, l.new_values, l.ip_address
    # INSERTs: actor_id, actor_type, action, entity_type, entity_id,
    #          new_values, ip_address
    # =========================================================
    (
        "audit_logs",
        """
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            actor_id INT NULL COMMENT 'References admin_users.id (future)',
            actor_type VARCHAR(50) NOT NULL COMMENT 'ADMIN, MODERATOR, SYSTEM',
            action VARCHAR(100) NOT NULL COMMENT 'UPDATE, DELETE, activate, suspend, ban, etc.',
            entity_type VARCHAR(100) NOT NULL COMMENT 'USER, BLOG, COMMENT, SYSTEM_SETTINGS, etc.',
            entity_id VARCHAR(36) NULL COMMENT 'ID of the entity acted upon',
            old_values JSON NULL,
            new_values JSON NULL,
            ip_address VARCHAR(45),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_logs_actor (actor_id),
            INDEX idx_audit_logs_entity (entity_type, entity_id),
            INDEX idx_audit_logs_action (action),
            INDEX idx_audit_logs_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),

    # =========================================================
    # 2. system_settings
    # Used by: admin/settings (GET/PUT), admin/recent-activity (GET)
    # SELECTs: setting_key, setting_value, updated_at
    # INSERTs: setting_key, setting_value, updated_by, updated_at
    # Uses ON DUPLICATE KEY UPDATE on setting_key (UNIQUE)
    # =========================================================
    (
        "system_settings",
        """
        CREATE TABLE IF NOT EXISTS system_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT NOT NULL,
            updated_by INT NULL COMMENT 'References admin_users.id (future)',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_system_settings_key (setting_key),
            INDEX idx_system_settings_updated (updated_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),

    # =========================================================
    # 3. moderation_actions
    # Used by: moderator/comments/[id] (PUT), editor/posts/[id]/review (POST)
    # INSERTs: moderator_id, target_type, target_id, action_type [, reason]
    # =========================================================
    (
        "moderation_actions",
        """
        CREATE TABLE IF NOT EXISTS moderation_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            moderator_id INT NOT NULL COMMENT 'References admin_users.id (future)',
            target_type VARCHAR(50) NOT NULL COMMENT 'COMMENT, BLOG, USER',
            target_id VARCHAR(36) NOT NULL COMMENT 'ID of the target entity',
            action_type VARCHAR(50) NOT NULL COMMENT 'approve, spam, trash, reject, changes_requested',
            reason TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_moderation_actions_moderator (moderator_id),
            INDEX idx_moderation_actions_target (target_type, target_id),
            INDEX idx_moderation_actions_type (action_type),
            INDEX idx_moderation_actions_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),

    # =========================================================
    # 4. editorial_feedback
    # Used by: editor/posts/[id]/review (POST)
    # INSERTs: blog_id, sender_id, recipient_id, feedback_type, message
    # =========================================================
    (
        "editorial_feedback",
        """
        CREATE TABLE IF NOT EXISTS editorial_feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            blog_id INT NOT NULL COMMENT 'References blogs.id (future)',
            sender_id INT NOT NULL COMMENT 'Editor who sends feedback (admin_users.id)',
            recipient_id INT NOT NULL COMMENT 'Author who receives feedback (admin_users.id)',
            feedback_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL' COMMENT 'GENERAL, CONTENT, STYLE, STRUCTURE, SEO',
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_editorial_feedback_blog (blog_id),
            INDEX idx_editorial_feedback_sender (sender_id),
            INDEX idx_editorial_feedback_recipient (recipient_id),
            INDEX idx_editorial_feedback_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),

    # =========================================================
    # 5. editorial_assignments
    # Used by: editor/assignments (GET/POST), editor/stats (GET)
    # SELECTs: ea.*, a.name (JOIN admin_users), b.id (LEFT JOIN blogs)
    # INSERTs: editor_id, author_id, topic, description, deadline, status
    # Status values from code: PENDING, ACCEPTED, IN_PROGRESS (+ COMPLETED, CANCELLED)
    # =========================================================
    (
        "editorial_assignments",
        """
        CREATE TABLE IF NOT EXISTS editorial_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            editor_id INT NOT NULL COMMENT 'Editor who assigned the task (admin_users.id)',
            author_id INT NOT NULL COMMENT 'Author assigned to write (admin_users.id)',
            blog_id INT NULL COMMENT 'Linked blog once created (blogs.id)',
            topic VARCHAR(255) NOT NULL,
            description TEXT NULL,
            deadline DATE NOT NULL,
            status ENUM('PENDING','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_editorial_assignments_editor (editor_id),
            INDEX idx_editorial_assignments_author (author_id),
            INDEX idx_editorial_assignments_blog (blog_id),
            INDEX idx_editorial_assignments_status (status),
            INDEX idx_editorial_assignments_deadline (deadline),
            INDEX idx_editorial_assignments_created (created_at DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),

    # =========================================================
    # 6. editorial_calendar
    # Used by: editor/calendar (GET/POST), editor/calendar/[id] (PUT/DELETE)
    # SELECTs: notes WHERE blog_id = ?
    # INSERTs: blog_id, notes, scheduled_date
    # UPDATEs: notes WHERE blog_id = ?
    # DELETEs: WHERE blog_id = ?
    # blog_id is UNIQUE (one calendar entry per blog)
    # =========================================================
    (
        "editorial_calendar",
        """
        CREATE TABLE IF NOT EXISTS editorial_calendar (
            id INT AUTO_INCREMENT PRIMARY KEY,
            blog_id INT NOT NULL UNIQUE COMMENT 'References blogs.id (future)',
            notes TEXT NULL,
            scheduled_date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_editorial_calendar_blog (blog_id),
            INDEX idx_editorial_calendar_date (scheduled_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ),
]


def main():
    conn = None
    cursor = None
    try:
        print("Connecting to MariaDB...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        # Check existing tables
        cursor.execute("SHOW TABLES")
        existing_tables = {row[0] for row in cursor.fetchall()}
        print(f"Existing tables ({len(existing_tables)}): {', '.join(sorted(existing_tables))}")

        created_count = 0
        skipped_count = 0

        for name, ddl in TABLES:
            if name in existing_tables:
                print(f"  ⚠️  Table '{name}' already exists — skipping")
                skipped_count += 1
                continue
            print(f"  🔨 Creating table '{name}'...")
            cursor.execute(ddl)
            print(f"     ✅ Table '{name}' created successfully")
            created_count += 1

        conn.commit()
        print(f"\n{'='*60}")
        print(f"  Created: {created_count} tables | Skipped: {skipped_count} tables")
        print(f"{'='*60}")

        # Verify all 6 tables
        print("\nVerifying all tables:")
        cursor.execute("SHOW TABLES")
        final_tables = {row[0] for row in cursor.fetchall()}

        all_ok = True
        for name, _ in TABLES:
            if name in final_tables:
                cursor.execute(f"DESCRIBE {name}")
                cols = cursor.fetchall()
                print(f"  ✅ {name} ({len(cols)} columns)")
                for col in cols:
                    nullable = "NULL" if col[2] == 'YES' else "NOT NULL"
                    key = f" [{col[3]}]" if col[3] else ""
                    print(f"       {col[0]:30s} {col[1]:30s} {nullable}{key}")
            else:
                print(f"  ❌ {name} — MISSING!")
                all_ok = False

        if all_ok:
            print("\n🎉 All 6 tables verified successfully!")

    except Error as e:
        print(f"\n❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("\nDone.")


if __name__ == '__main__':
    main()
