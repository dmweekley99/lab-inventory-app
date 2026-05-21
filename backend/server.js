const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();


const ADMIN_GROUP_NAME = process.env.ADMIN_GROUP_NAME || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const app = express();


app.use(cors());
app.use(express.json());
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- AUTO-INIT ADMIN GROUP/USER IF DB IS EMPTY ---
// ...existing code...
async function ensureAdminGroupAndUser() {
  try {
    // Check if any groups or users exist
    const groupCount = await pool.query('SELECT COUNT(*) FROM groups');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(groupCount.rows[0].count) === 0 && parseInt(userCount.rows[0].count) === 0) {
      // Create admin group (is_hidden = true)
      const groupRes = await pool.query(
        "INSERT INTO groups (name, is_hidden) VALUES ($1, TRUE) RETURNING id",
        [ADMIN_GROUP_NAME]
      );
      const adminGroupId = groupRes.rows[0].id;
      // Create admin user
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const userRes = await pool.query(
        "INSERT INTO users (email, password_hash, role, group_id) VALUES ($1, $2, 'admin', $3) RETURNING id",
        [ADMIN_EMAIL, passwordHash, adminGroupId]
      );
      const adminUserId = userRes.rows[0].id;
      // Set owner_user_id in group
      await pool.query(
        "UPDATE groups SET owner_user_id = $1 WHERE id = $2",
        [adminUserId, adminGroupId]
      );
      console.log(`Initialized admin group (${ADMIN_GROUP_NAME}) and admin user (${ADMIN_EMAIL})`);
    }
  } catch (err) {
    console.error('Error during admin group/user auto-init:', err);
  }
}

// Call after pool is defined
ensureAdminGroupAndUser();

// ...existing code...

// --- SOCKET.IO ---
const http = require('http');
const server = http.createServer(app);
const { initSocket, emitItemOrdered } = require('./socket');
initSocket(server);

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// --- AUTH ROUTES ---
// Register user with group_id
app.post("/api/auth/register", async (req, res) => {
  const { email, password, group_id } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, group_id) VALUES ($1, $2, $3) RETURNING id, email, role, group_id",
      [email, passwordHash, group_id]
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
  // Automatically set role to 'admin' if in admin group
  const ADMIN_GROUP_ID = 1; // Change if your admin group id is different
  const role = (user.group_id === ADMIN_GROUP_ID) ? 'admin' : (user.role || 'user');
  const token = jwt.sign(
    { id: user.id, email: user.email, role, group_id: user.group_id },
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

// Get a single catalog item by id (protected, group-aware)
app.get("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const group_id = req.user.group_id;
    const result = await pool.query(
      "SELECT * FROM material_catalog WHERE id = $1 AND group_id = $2 LIMIT 1",
      [id, group_id]
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

app.get("/api/groups/approved", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM groups WHERE is_hidden = FALSE ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete material from catalog by id (protected, group-aware)
app.delete("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const group_id = req.user.group_id;
    const result = await pool.query("DELETE FROM material_catalog WHERE id = $1 AND group_id = $2 RETURNING *", [id, group_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all catalog materials (protected, group-aware)
app.get("/api/catalog", requireAuth, async (req, res) => {
  try {
    const group_id = req.user.group_id;
    const result = await pool.query(
      "SELECT * FROM material_catalog WHERE group_id = $1 ORDER BY name ASC",
      [group_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/catalog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update status of a catalog item (protected, group-aware)
app.patch("/api/catalog/:id/status", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const group_id = req.user.group_id;
    const result = await pool.query(
      "UPDATE material_catalog SET status = $1 WHERE id = $2 AND group_id = $3 RETURNING *",
      [status, id, group_id]
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

// Add material to catalog (protected, group-aware)
app.post("/api/catalog", requireAuth, async (req, res) => {
  try {
    const group_id = req.user.group_id;
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
        (name, catalog_number, severity, default_location, preferred_vendor, purchase_url, notes, group_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [name, catalog_number, severity, default_location, preferred_vendor, purchase_url, notes, group_id]
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

// Update catalog item fields (e.g., severity) (protected, group-aware)
app.patch("/api/catalog/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const group_id = req.user.group_id;
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
    // Add id and group_id to the end of the values array
    values.push(id);
    values.push(group_id);
    const result = await pool.query(
      `UPDATE material_catalog SET ${updates.join(", ")} WHERE id = $${idx} AND group_id = $${idx + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Catalog item not found" });
    }
    // If status is set to 'Needs Ordered', create an order if one doesn't exist
    if (fields.status === "Needs Ordered") {
      const orderCheck = await pool.query(
        "SELECT * FROM orders WHERE material_id = $1 AND group_id = $2 AND delivered_on IS NULL",
        [id, group_id]
      );
      if (orderCheck.rows.length === 0) {
        await pool.query(
          "INSERT INTO orders (material_id, group_id) VALUES ($1, $2)",
          [id, group_id]
        );
      }
    }
    console.log("PATCH /api/catalog/:id updated row:", result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/catalog/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- ORDERS ROUTES ---
// Create a new order
app.post("/api/orders", requireAuth, async (req, res) => {
  try {
    const group_id = req.user.group_id;
    const { material_id, price_paid, ordered_by, received_by, ordered_on, delivered_on } = req.body;
    const result = await pool.query(
      `INSERT INTO orders (material_id, group_id, price_paid, ordered_by, received_by, ordered_on, delivered_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [material_id, group_id, price_paid, ordered_by, received_by, ordered_on, delivered_on]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Filter orders
app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    const group_id = req.user.group_id;
    const { ordered_by, received_by, ordered_on, delivered_on, name } = req.query;
    let query = `SELECT o.*, m.name FROM orders o JOIN material_catalog m ON o.material_id = m.id WHERE o.group_id = $1`;
    const params = [group_id];
    if (ordered_by) { query += ` AND o.ordered_by ILIKE $${params.length + 1}`; params.push(`%${ordered_by}%`); }
    if (received_by) { query += ` AND o.received_by ILIKE $${params.length + 1}`; params.push(`%${received_by}%`); }
    if (ordered_on) { query += ` AND DATE(o.ordered_on) = $${params.length + 1}`; params.push(ordered_on); }
    if (delivered_on) { query += ` AND DATE(o.delivered_on) = $${params.length + 1}`; params.push(delivered_on); }
    if (name) { query += ` AND m.name ILIKE $${params.length + 1}`; params.push(`%${name}%`); }
    query += ` ORDER BY o.ordered_on DESC NULLS LAST`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/orders error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export orders to CSV
app.get("/api/orders/export", requireAuth, async (req, res) => {
  try {
    const group_id = req.user.group_id;
    const { ordered_by, received_by, ordered_on, delivered_on, name } = req.query;
    let query = `SELECT o.*, m.name FROM orders o JOIN material_catalog m ON o.material_id = m.id WHERE o.group_id = $1`;
    const params = [group_id];
    if (ordered_by) { query += ` AND o.ordered_by ILIKE $${params.length + 1}`; params.push(`%${ordered_by}%`); }
    if (received_by) { query += ` AND o.received_by ILIKE $${params.length + 1}`; params.push(`%${received_by}%`); }
    if (ordered_on) { query += ` AND DATE(o.ordered_on) = $${params.length + 1}`; params.push(ordered_on); }
    if (delivered_on) { query += ` AND DATE(o.delivered_on) = $${params.length + 1}`; params.push(delivered_on); }
    if (name) { query += ` AND m.name ILIKE $${params.length + 1}`; params.push(`%${name}%`); }
    query += ` ORDER BY o.ordered_on DESC NULLS LAST`;
    const result = await pool.query(query, params);
    // Convert to CSV
    const fields = result.fields.map(f => f.name);
    const csvRows = [fields.join(",")].concat(result.rows.map(row => fields.map(f => row[f]).join(",")));
    res.header("Content-Type", "text/csv");
    res.attachment("orders.csv");
    res.send(csvRows.join("\n"));
  } catch (err) {
    console.error("GET /api/orders/export error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update an order and sync catalog item status
app.patch("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const group_id = req.user.group_id;
    const { ordered_by, received_by, ordered_on, delivered_on, price_paid } = req.body;

    // Update the order
    const result = await pool.query(
      `UPDATE orders SET ordered_by = $1, received_by = $2, ordered_on = $3, delivered_on = $4, price_paid = $5
       WHERE id = $6 AND group_id = $7 RETURNING *`,
      [ordered_by, received_by, ordered_on, delivered_on, price_paid, id, group_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Also update the catalog item status
    const order = result.rows[0];
    let newStatus = null;
    if (delivered_on) {
      newStatus = "Received";
    } else if (ordered_on) {
      newStatus = "Ordered";
    }
    if (newStatus) {
      await pool.query(
        "UPDATE material_catalog SET status = $1 WHERE id = $2 AND group_id = $3",
        [newStatus, order.material_id, group_id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /api/orders/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- GROUP REGISTRATION ---
// Table: pending_groups (id SERIAL, name TEXT UNIQUE, approved BOOLEAN DEFAULT FALSE)
app.post("/api/groups/register", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Group name required" });
  try {
    // Insert as pending approval
    await pool.query(
      "INSERT INTO pending_groups (name, approved) VALUES ($1, FALSE)",
      [name]
    );
    res.status(201).json({ message: "Group registration request submitted for approval." });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: "Group name already requested or exists." });
    }
    res.status(500).json({ error: err.message });
  }
});


// Register a new group and the first user as Owner
app.post("/api/groups/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Group name, email, and password required" });
  try {
    // Create the user first (so we have their id)
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'Owner') RETURNING id",
      [email, passwordHash]
    );
    const user_id = userResult.rows[0].id;
    // Insert group with owner_user_id
    const groupResult = await pool.query(
      "INSERT INTO groups (name, owner_user_id) VALUES ($1, $2) RETURNING id",
      [name, user_id]
    );
    const group_id = groupResult.rows[0].id;
    // Assign the user to the group
    await pool.query(
      "UPDATE users SET group_id = $1 WHERE id = $2",
      [group_id, user_id]
    );
    res.status(201).json({ message: "Group and owner user created.", group_id, owner_user_id: user_id });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: "Group name or user email already exists." });
    }
    res.status(500).json({ error: err.message });
  }
});

// Owner approves a pending user for their group
app.post("/api/groups/:groupId/approve-user", requireAuth, async (req, res) => {
  const { groupId } = req.params;
  const { userId, role } = req.body; // role: 'Head' or 'User'
  // Check if requester is the owner
  const group = await pool.query("SELECT owner_user_id FROM groups WHERE id = $1", [groupId]);
  if (!group.rows.length || group.rows[0].owner_user_id !== req.user.id) {
    return res.status(403).json({ error: "Only the group owner can approve users." });
  }
  // Approve user and set role
  await pool.query(
    "UPDATE users SET group_id = $1, role = $2 WHERE id = $3",
    [groupId, role, userId]
  );
  res.json({ message: "User approved and role set." });
});

// Owner changes a user's role in their group
app.patch("/api/groups/:groupId/user/:userId/role", requireAuth, async (req, res) => {
  const { groupId, userId } = req.params;
  const { role } = req.body; // 'Owner', 'Head', or 'User'
  // Only owner can change roles
  const group = await pool.query("SELECT owner_user_id FROM groups WHERE id = $1", [groupId]);
  if (!group.rows.length || group.rows[0].owner_user_id !== req.user.id) {
    return res.status(403).json({ error: "Only the group owner can change roles." });
  }
  await pool.query(
    "UPDATE users SET role = $1 WHERE id = $2 AND group_id = $3",
    [role, userId, groupId]
  );
  res.json({ message: "User role updated." });
});

// Endpoint to list approved groups for dropdown (hide admin group)
app.get("/api/groups/approved", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM groups WHERE is_hidden = FALSE ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to list approved groups for dropdown
app.get("/api/groups/approved", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM groups ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List pending groups (admin only)
app.get("/api/groups/pending", requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const result = await pool.query("SELECT * FROM pending_groups WHERE approved = FALSE ORDER BY created_at ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT || 5050);
