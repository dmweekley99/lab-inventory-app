CREATE TABLE material_catalog (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  catalog_number TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('Good', 'Low', 'Very Low', 'Critical')),
  default_location TEXT,
  preferred_vendor TEXT,
  purchase_url TEXT,
  notes TEXT,
  ordered_by TEXT,
  status TEXT DEFAULT 'Needs Ordered',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ordered_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  delivered_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);