-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ordered_on TIMESTAMPTZ DEFAULT NULL,
  delivered_on TIMESTAMPTZ DEFAULT NULL
);