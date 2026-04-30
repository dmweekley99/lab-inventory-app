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

// Update status of a catalog item
app.patch("/api/catalog/:id/status", async (req, res) => {
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/catalog/:id/status error:", err);
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
// Update catalog item fields (e.g., severity)

app.patch("/api/catalog/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    console.log("PATCH /api/catalog/:id body:", fields);
    const allowed = ["name", "catalog_number", "severity", "default_location", "preferred_vendor", "purchase_url", "status"];
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
