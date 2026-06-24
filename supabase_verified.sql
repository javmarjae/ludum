-- ── Verificación de perfiles y comunidades ───────────────────────────────────
-- is_verified en profiles se gestiona solo por admins (service role / dashboard)
-- is_official en communities ya existe — no requiere cambios

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Índice parcial para listar verificados rápido
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified
  ON profiles(is_verified) WHERE is_verified = TRUE;

-- Trigger: protege el campo is_verified de auto-modificación vía RLS
-- Los usuarios pueden actualizar su propio perfil pero no su estado de verificación
CREATE OR REPLACE FUNCTION prevent_self_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND auth.uid() IS NOT NULL      -- sólo aplica a llamadas autenticadas (no service role)
     AND auth.uid() = OLD.id
  THEN
    RAISE EXCEPTION 'La verificación solo puede ser otorgada por administradores.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_is_verified ON profiles;
CREATE TRIGGER protect_is_verified
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_verification();
