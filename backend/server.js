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

// Get all catalog materials
app.get("/api/catalog", async (req, res) => {
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

// Add material to catalog
app.post("/api/catalog", async (req, res) => {
  try {
    const {
      name,
      category,
      default_location,
      preferred_vendor,
      purchase_url,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO material_catalog
      (name, category, default_location, preferred_vendor, purchase_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [name, category, default_location, preferred_vendor, purchase_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/catalog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all requests
app.get("/api/requests", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id,
        r.material_id,
        c.name AS catalog_material_name,
        r.custom_material_name,
        COALESCE(c.name, r.custom_material_name) AS material_name,
        r.location,
        r.severity,
        r.notes,
        r.status,
        r.submitted_by,
        r.created_at,
        c.category,
        c.preferred_vendor,
        c.purchase_url
      FROM material_requests r
      LEFT JOIN material_catalog c ON r.material_id = c.id
      ORDER BY
        CASE r.severity
          WHEN 'Critical' THEN 1
          WHEN 'Very Low' THEN 2
          WHEN 'Low' THEN 3
          WHEN 'Good' THEN 4
          ELSE 5
        END,
        r.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/requests error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add new request
app.post("/api/requests", async (req, res) => {
  try {
    const {
      material_id,
      custom_material_name,
      location,
      severity,
      notes,
      submitted_by,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO material_requests
      (material_id, custom_material_name, location, severity, notes, submitted_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        material_id || null,
        custom_material_name || null,
        location,
        severity,
        notes,
        submitted_by,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/requests error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update request status
app.patch("/api/requests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE material_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/requests/:id/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

app.delete("/api/requests/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM material_requests WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ message: "Request deleted", deleted: result.rows[0] });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete request" });
  }
});