import { useState, useEffect } from "react";
import "./App.css";

function InventoryCatalog() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({
        name: "",
        severity: "Low",
        location: "",
        notes: "",
        category: "General"
    });
    const [filter, setFilter] = useState("");
    const [filterCategory, setFilterCategory] = useState("");

    useEffect(() => {
        // Fetch catalog items from backend
        fetch("http://localhost:5050/api/catalog")
            .then((res) => res.json())
            .then((data) => setItems(data));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRequest = async (item) => {
        // POST to backend Inventory Requests API
        await fetch("http://localhost:5050/api/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                custom_material_name: item.name,
                location: item.location,
                severity: item.severity,
                notes: item.notes,
                submitted_by: "Catalog Quick Add"
            })
        });
        alert(`Requested: ${item.name}`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Add new item to catalog via backend
        const res = await fetch("http://localhost:5050/api/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: form.name,
                category: form.category,
                default_location: form.location,
                preferred_vendor: "",
                purchase_url: ""
            })
        });
        const newItem = await res.json();
        setItems([...items, newItem]);
        setForm({ name: "", severity: "Low", location: "", notes: "", category: "General" });
    };

    const lowItems = items.filter((item) => item.severity === "Low" || item.severity === "Very Low" || item.severity === "Critical");

    // Unique categories for filter dropdown
    const categories = [
        ...new Set(["General", ...items.map((item) => item.category || "General")])
    ];

    // Filtered items
    const filteredItems = items.filter(
        (item) =>
            (!filter || item.name.toLowerCase().includes(filter.toLowerCase())) &&
            (!filterCategory || (item.category || "General") === filterCategory)
    );

    return (
        <div className="inventory-catalog">
            <h2>Inventory Catalog</h2>
            <form onSubmit={handleSubmit} className="inventory-form">
                <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Item Name"
                    required
                />
                <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    name="severity"
                    value={form.severity}
                    onChange={handleChange}
                    required
                >
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                    <option value="Very Low">Very Low</option>
                    <option value="Critical">Critical</option>
                </select>
                <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Location"
                />
                <input
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                />
                <button type="submit">Add Item</button>
            </form>

            <div style={{ margin: '1em 0' }}>
                <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ marginRight: 8 }}
                />
                <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <h3>All Items</h3>
            <ul>
                {filteredItems.map((item) => (
                    <li key={item.id}>
                        <strong>{item.name}</strong> {item.severity} - {item.location} {item.notes && `- ${item.notes}`} [{item.category || "General"}]
                        <button style={{ marginLeft: 8 }} onClick={() => handleRequest(item)}>Request This</button>
                    </li>
                ))}
            </ul>
            <h3>Low Inventory Items</h3>
            <ul>
                {lowItems.length === 0 && <li>No low inventory items.</li>}
                {lowItems.map((item) => (
                    <li key={item.id}>
                        <strong>{item.name}</strong> ({item.severity}) - {item.location} [{item.category || "General"}]
                        <button style={{ marginLeft: 8 }} onClick={() => handleRequest(item)}>Request This</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default InventoryCatalog;
