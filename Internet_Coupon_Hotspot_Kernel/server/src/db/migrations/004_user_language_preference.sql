-- 004_user_language_preference.sql
-- Adds language preference support (en, am, om) to the owners/users table.

ALTER TABLE owners ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
