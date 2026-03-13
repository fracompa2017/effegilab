-- Admin backoffice core tables.
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS seo_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  og_image TEXT,
  og_title TEXT,
  og_description TEXT,
  canonical TEXT,
  robots TEXT DEFAULT 'index,follow',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'seo_settings'
      AND policyname = 'Admin manages SEO'
  ) THEN
    CREATE POLICY "Admin manages SEO"
    ON seo_settings
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'integrations'
      AND policyname = 'Admin manages integrations'
  ) THEN
    CREATE POLICY "Admin manages integrations"
    ON integrations
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settings'
      AND policyname = 'Admin manages settings'
  ) THEN
    CREATE POLICY "Admin manages settings"
    ON settings
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'api_keys'
      AND policyname = 'Admin manages API keys'
  ) THEN
    CREATE POLICY "Admin manages API keys"
    ON api_keys
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;
END $$;

INSERT INTO integrations (name, enabled, config)
VALUES
  ('facebook_pixel', false, '{"pixel_id": ""}'::jsonb),
  ('google_analytics', false, '{"measurement_id": ""}'::jsonb),
  ('google_tag_manager', false, '{"container_id": ""}'::jsonb),
  ('tiktok_pixel', false, '{"pixel_id": ""}'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO settings (key, value)
VALUES
  ('store', '{"name":"Effegi Lab","email":"info@effegi-lab.it","phone":"","address":"Napoli, Italia","vat":"04752200610"}'::jsonb),
  ('shipping', '{"free_threshold":150,"standard_cost":6.90,"delivery_days":7}'::jsonb),
  ('payments', '{"stripe":true,"cod":true,"bank_transfer":false}'::jsonb),
  ('whatsapp', '{"number":"","enabled":true}'::jsonb),
  ('email', '{"admin_email":"info@effegi-lab.it","sender_name":"Effegi Lab","confirm_customer":true,"notify_admin":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
