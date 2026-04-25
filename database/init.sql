CREATE TABLE material_catalog (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  default_location TEXT,
  preferred_vendor TEXT,
  purchase_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE material_requests (
  id SERIAL PRIMARY KEY,
  material_id INTEGER REFERENCES material_catalog(id),
  custom_material_name TEXT,
  location TEXT,
  severity TEXT CHECK (severity IN ('Good', 'Low', 'Very Low', 'Critical')),
  notes TEXT,
  status TEXT DEFAULT 'Needs Ordered',
  submitted_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);