-- Migration: add admin and permission columns to profiles
-- Run in Supabase SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_write_blog     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS can_create_events  BOOLEAN NOT NULL DEFAULT FALSE;

-- Bootstrap: make yourself admin (replace with your UUID from auth.users)
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'your-user-uuid-here';
