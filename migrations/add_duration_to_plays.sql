-- Add duration tracking to plays
ALTER TABLE plays ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
