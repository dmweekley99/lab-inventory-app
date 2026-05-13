const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- SOCKET.IO ---
const http = require('http');
const server = http.createServer(app);
const { initSocket, emitItemOrdered } = require('./socket');
initSocket(server);

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
      [email, passwordHash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: "User already exists or invalid request" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid login" });
  }
  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid login" });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );
  res.json({ token });
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// Get a single catalog item by id (protected)
app.get("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM material_catalog WHERE id = $1 LIMIT 1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catalog item not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete material from catalog by id (protected)
app.delete("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM material_catalog WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all catalog materials (protected)
app.get("/api/catalog", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM material_catalog ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/catalog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update status of a catalog item (protected)
app.patch("/api/catalog/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Optionally, you may want to check if the item exists first
    const result = await pool.query(
      "UPDATE material_catalog SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catalog item not found" });
    }
    // Emit real-time update to all clients
    emitItemOrdered(result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/catalog/:id/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add material to catalog (protected)
app.post("/api/catalog", requireAuth, async (req, res) => {
  try {
    console.log("POST /api/catalog called with body:", req.body);
    const {
      name,
      catalog_number,
      severity,
      default_location,
      preferred_vendor,
      purchase_url,
      notes,
    } = req.body;

    let result;
    try {
      result = await pool.query(
        `INSERT INTO material_catalog
        (name, catalog_number, severity, default_location, preferred_vendor, purchase_url, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [name, catalog_number, severity, default_location, preferred_vendor, purchase_url, notes]
      );
    } catch (err) {
      console.error("Error during INSERT INTO material_catalog:", err);
      if (err.code === '23505') {
        // Duplicate key error (unique constraint violation)
        return res.status(409).json({ error: 'Item already exists in the catalog.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/catalog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update catalog item fields (e.g., severity) (protected)
app.patch("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    // Ensure notes is always a string, never null
    if (fields.notes === null) fields.notes = "";
    // Reset notes if severity is set to Good
    if (fields.severity === "Good") {
      fields.notes = "";
    }
    console.log("PATCH /api/catalog/:id body:", fields);
    const allowed = ["name", "catalog_number", "severity", "default_location", "preferred_vendor", "purchase_url", "status", "ordered_on", "delivered_on", "ordered_by", "received_by", "notes"];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = $${idx}`);
        values.push(fields[key]);
        idx++;
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE material_catalog SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catalog item not found" });
    }
    console.log("PATCH /api/catalog/:id updated row:", result.rows[0]);
    // Emit real-time update for any item change (undo, received, etc)
    emitItemOrdered(result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

server.listen(process.env.PORT || 5050, '0.0.0.0', () => {
  console.log('Server and Socket.IO listening on port', process.env.PORT || 5050);
});
