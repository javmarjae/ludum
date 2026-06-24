-- Organization requests: users submit, admins approve/reject
CREATE TABLE IF NOT EXISTS organization_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('asociacion', 'tienda')),
  description text,
  location    text,
  website     text,
  status      text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  admin_notes text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE organization_requests ENABLE ROW LEVEL SECURITY;

-- Users can see and submit their own requests
CREATE POLICY "users_see_own_org_requests" ON organization_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "users_insert_org_requests" ON organization_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Ludum admins have full access
CREATE POLICY "admins_manage_org_requests" ON organization_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
