-- Añade columna para saber si el usuario ya completó el tutorial de bienvenida
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
