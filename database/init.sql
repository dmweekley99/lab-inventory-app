-- Groups table for multi-tenancy
CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  received_by TEXT,
  status TEXT DEFAULT 'Needs Ordered',
  group_id INTEGER REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ordered_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  delivered_on TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES material_catalog(id),
  group_id INTEGER REFERENCES groups(id),
  price_paid NUMERIC(10,2)
);