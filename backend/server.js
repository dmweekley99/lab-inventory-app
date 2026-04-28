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

// Get a single request by id
app.get("/api/requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
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
        c.preferred_vendor,
        c.purchase_url
      FROM material_requests r
      LEFT JOIN material_catalog c ON r.material_id = c.id
      WHERE r.id = $1
      LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /api/requests/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single catalog item by id
app.get("/api/catalog/:id", async (req, res) => {
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

// Delete material from catalog by id
app.delete("/api/catalog/:id", async (req, res) => {
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
    console.log("POST /api/catalog called with body:", req.body);
    const {
      name,
      catalog_number,
      severity,
      default_location,
      preferred_vendor,
      purchase_url,
    } = req.body;

    let result;
    try {
      result = await pool.query(
        `INSERT INTO material_catalog
        (name, catalog_number, severity, default_location, preferred_vendor, purchase_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [name, catalog_number, severity, default_location, preferred_vendor, purchase_url]
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
      material_id, // allow direct linking if provided
      custom_material_name,
      location,
      severity,
      notes,
      submitted_by,
    } = req.body;

    let finalMaterialId = material_id || null;
    let finalCustomMaterialName = custom_material_name || null;

    // If no material_id but a custom_material_name is provided, check catalog
    if (!finalMaterialId && custom_material_name) {
      const catalogRes = await pool.query(
        "SELECT id FROM material_catalog WHERE LOWER(name) = LOWER($1) LIMIT 1",
        [custom_material_name]
      );
      if (catalogRes.rows.length > 0) {
        finalMaterialId = catalogRes.rows[0].id;
        finalCustomMaterialName = null; // Use catalog, not custom
      }
    }

    const result = await pool.query(
      `INSERT INTO material_requests
      (material_id, custom_material_name, location, severity, notes, submitted_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        finalMaterialId,
        finalCustomMaterialName,
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

app.patch("/api/requests/:id/severity", async (req, res) => {
  const { id } = req.params;
  const { severity } = req.body;

  try {
    const result = await pool.query(
      "UPDATE material_requests SET severity = $1 WHERE id = $2 RETURNING *",
      [severity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update severity error:", err);
    res.status(500).json({ error: "Failed to update severity" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
