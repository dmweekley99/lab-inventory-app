import { useState, useEffect } from "react";
import "./App.css";

function InventoryCatalog() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({
        name: "",
        catalog_number: "",
        severity: "",
        default_location: "",
        category: "General",
        preferred_vendor: "",
        purchase_url: "",
    });

    const [filter, setFilter] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    const fetchCatalog = async () => {
        const res = await fetch("http://localhost:5050/api/catalog");
        const data = await res.json();

        setItems(
            data.map((item) => {
                let severity = item.severity;

                if (!severity && item.notes) {
                    try {
                        const notesObj = JSON.parse(item.notes);
                        if (notesObj && notesObj.severity) {
                            severity = notesObj.severity;
                        }
                    } catch {
                        // ignore invalid JSON notes
                    }
                }

                return { ...item, severity };
            })
        );
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRequest = async (item) => {
        const res = await fetch("http://localhost:5050/api/requests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                custom_material_name: item.name,
                location: item.location || item.default_location || "",
                severity: item.severity || "",
                notes: item.notes || "",
                submitted_by: "Catalog Quick Add",
            }),
        });

        if (!res.ok) {
            console.error("Failed to create request");
            return;
        }

        window.location.href = "/";
    };

    const handleDelete = async (item) => {
        const confirm1 = window.confirm(
            `Are you sure you want to delete '${item.name}' from the catalog? This cannot be undone.`
        );

        if (!confirm1) return;

        const confirm2 = window.confirm(
            `Please confirm again: Delete '${item.name}'?`
        );

        if (!confirm2) return;

        const res = await fetch(`http://localhost:5050/api/catalog/${item.id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            console.error("Failed to delete catalog item");
            return;
        }

        setItems(items.filter((i) => i.id !== item.id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch("http://localhost:5050/api/catalog", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: form.name,
                catalog_number: form.catalog_number,
                severity: form.severity,
                default_location: form.default_location,
                category: form.category,
                preferred_vendor: form.preferred_vendor,
                purchase_url: form.purchase_url,
            }),
        });

        if (!res.ok) {
            console.error("Failed to add catalog item");
            return;
        }

        const newItem = await res.json();
        setItems([...items, newItem]);
        setForm({
            name: "",
            catalog_number: "",
            severity: "",
            default_location: "",
            category: "General",
            preferred_vendor: "",
            purchase_url: "",
        });
    };

    const lowItems = items.filter(
        (item) =>
            item.severity === "Low" ||
            item.severity === "Very Low" ||
            item.severity === "Critical"
    );

    const categories = [
        ...new Set(["General", ...items.map((item) => item.category || "General")]),
    ];

    const filteredItems = items.filter((item) => {
        const itemName = item.name || "";

        return (
            (!filter || itemName.toLowerCase().includes(filter.toLowerCase())) &&
            (!filterCategory || (item.category || "General") === filterCategory)
        );
    });

    return (
        <div className="inventory-catalog">
            <h1>Inventory Catalog</h1>

            <form onSubmit={handleSubmit} className="inventory-form">
                <input
                    id="catalog-name"
                    name="name"
                    autoComplete="off"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Item Name"
                    required
                />
                <input
                    id="catalog-number"
                    name="catalog_number"
                    autoComplete="off"
                    value={form.catalog_number}
                    onChange={handleChange}
                    placeholder="Catalog Number"
                    required
                />
                <select
                    id="catalog-severity"
                    name="severity"
                    autoComplete="off"
                    value={form.severity}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Severity</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                    <option value="Very Low">Very Low</option>
                    <option value="Critical">Critical</option>
                </select>
                <input
                    id="catalog-default-location"
                    name="default_location"
                    autoComplete="off"
                    value={form.default_location}
                    onChange={handleChange}
                    placeholder="Default Location"
                    required
                />
                <input
                    id="catalog-category"
                    name="category"
                    autoComplete="off"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Category"
                />
                <input
                    id="catalog-preferred-vendor"
                    name="preferred_vendor"
                    autoComplete="off"
                    value={form.preferred_vendor}
                    onChange={handleChange}
                    placeholder="Preferred Vendor"
                />
                <input
                    id="catalog-purchase-url"
                    name="purchase_url"
                    autoComplete="off"
                    value={form.purchase_url}
                    onChange={handleChange}
                    placeholder="Purchase URL"
                />
                <button type="submit">Add Item</button>
            </form>

            <div style={{ margin: "1em 0" }}>
                <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ marginRight: 8 }}
                />

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <h3>All Items</h3>

            <div className="inventory-catalog-cards">
                {filteredItems.map((item) => (
                    <div className="inventory-card" key={item.id}>
                        <div className="card-title">{item.name}</div>
                        <div className="card-category">{item.category || "General"}</div>
                        <div className="card-severity">
                            Severity: {item.severity || "N/A"}
                        </div>
                        <div className="card-location">
                            Location: {item.location || item.default_location || "N/A"}
                        </div>

                        {item.notes && <div className="card-notes">Notes: {item.notes}</div>}

                        <div className="card-actions">
                            <button onClick={() => handleRequest(item)}>Request This</button>
                            <button
                                style={{ background: "#e74c3c", color: "#fff" }}
                                onClick={() => handleDelete(item)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <h3>Low Inventory Items</h3>

            <div className="inventory-catalog-cards">
                {lowItems.length === 0 && (
                    <div style={{ color: "#b0b3b8" }}>No low inventory items.</div>
                )}

                {lowItems.map((item) => (
                    <div className="inventory-card" key={item.id}>
                        <div className="card-title">{item.name}</div>
                        <div className="card-category">{item.category || "General"}</div>
                        <div className="card-severity">
                            Severity: {item.severity || "N/A"}
                        </div>
                        <div className="card-location">
                            Location: {item.location || item.default_location || "N/A"}
                        </div>

                        {item.notes && <div className="card-notes">Notes: {item.notes}</div>}

                        <div className="card-actions">
                            <button onClick={() => handleRequest(item)}>Request This</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default InventoryCatalog;