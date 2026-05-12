import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "./api";
import socket from "./socket";

function InventoryCatalog() {
    const location = useLocation();
    const [items, setItems] = useState([]);
    const [form, setForm] = useState({
        name: "",
        catalog_number: "",
        severity: "",
        default_location: "",
        preferred_vendor: "",
        purchase_url: "",
        notes: "",
    });
    // Remove separate filter states, use form state for filtering


    const fetchCatalog = async () => {
        try {
            const res = await api.get("/api/catalog");
            const data = res.data;
            console.log("Catalog API response:", data);
            if (Array.isArray(data)) {
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
            } else {
                setItems([]);
                if (data && data.error) {
                    console.error("Catalog fetch error:", data.error);
                } else {
                    console.error("Catalog API did not return an array.", data);
                }
            }
        } catch (err) {
            setItems([]);
            console.error("Failed to fetch catalog:", err);
        }
    };

    // Prefill form from query params if present
    useEffect(() => {
        fetchCatalog();
        const params = new URLSearchParams(location.search);
        const prefill = {};
        for (const key of ["name", "severity", "default_location", "notes"]) {
            if (params.get(key)) prefill[key] = params.get(key);
        }
        if (Object.keys(prefill).length > 0) {
            setForm((f) => ({ ...f, ...prefill }));
        }

        // Listen for real-time updates
        socket.on("itemOrdered", (item) => {
            // Optionally: only refetch if item is in current filter
            fetchCatalog();
        });
        return () => {
            socket.off("itemOrdered");
        };
    }, [location.search]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    // ...existing code...

    // The rest of the component remains unchanged


    const handleDelete = async (item) => {
        const confirm1 = window.confirm(
            `Are you sure you want to delete '${item.name}' from the catalog? This cannot be undone.`
        );

        if (!confirm1) return;

        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog/${item.id}`, {
            method: "DELETE",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
            console.error("Failed to delete catalog item");
            return;
        }

        setItems(items.filter((i) => i.id !== item.id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                name: form.name,
                catalog_number: form.catalog_number,
                severity: form.severity,
                default_location: form.default_location,
                preferred_vendor: form.preferred_vendor,
                purchase_url: form.purchase_url,
                notes: form.notes,
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
            preferred_vendor: "",
            purchase_url: "",
            notes: "",
        });
    };

    const lowItems = items.filter(
        (item) =>
            item.severity === "Low" ||
            item.severity === "Very Low" ||
            item.severity === "Critical"
    );

    const filteredItems = items.filter((item) => {
        const itemName = (item.name || "").toLowerCase();
        const itemLocation = (item.location || item.default_location || "").toLowerCase();
        const itemVendor = (item.preferred_vendor || "").toLowerCase();
        return (
            (!form.name || itemName.includes(form.name.toLowerCase())) &&
            (!form.default_location || itemLocation.includes(form.default_location.toLowerCase())) &&
            (!form.preferred_vendor || itemVendor.includes(form.preferred_vendor.toLowerCase()))
        );
    });

    return (
        <><div className="inventory-catalog">
            <h1 className="main-title">Inventory Catalog</h1>

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
                    placeholder="Location"
                    required
                />
                <input
                    id="catalog-preferred-vendor"
                    name="preferred_vendor"
                    autoComplete="off"
                    value={form.preferred_vendor}
                    onChange={handleChange}
                    placeholder="Preferred Vendor (filters list)"
                />
                <input
                    id="catalog-purchase-url"
                    name="purchase_url"
                    autoComplete="off"
                    value={form.purchase_url}
                    onChange={handleChange}
                    placeholder="Purchase URL"
                />
                <input
                    id="catalog-notes"
                    name="notes"
                    autoComplete="off"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                />
                <button type="submit">Add Item</button>
            </form>
        </div><h3>All Items</h3><div className="inventory-catalog-cards">
                {filteredItems.map((item) => (
                    <div className="inventory-card" key={item.id} style={{ position: 'relative' }}>
                        <button
                            title="Delete"
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 20,
                                color: '#d32f2f',
                                zIndex: 2
                            }}
                            onClick={() => handleDelete(item)}
                        >
                            <span role="img" aria-label="delete">🗑️</span>
                        </button>
                        <Link to={`/catalog/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="card-title">{item.name}</div>
                            <div className="card-severity">
                                Severity: {item.severity || "N/A"}
                            </div>
                            <div className="card-location">
                                Location: {item.location || item.default_location || "N/A"}
                            </div>
                        </Link>
                        <div className="card-severity">
                            <label htmlFor={`severity-select-${item.id}`}>Severity: </label>
                            <select
                                id={`severity-select-${item.id}`}
                                name={`severity-select-${item.id}`}
                                value={item.severity || ""}
                                onChange={async (e) => {
                                    const newSeverity = e.target.value;
                                    let patchBody = { severity: newSeverity };
                                    if (["Low", "Very Low", "Critical"].includes(newSeverity)) {
                                        patchBody.status = "Needs Ordered";
                                    }
                                    const token = localStorage.getItem("token");
                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog/${item.id}`, {
                                        method: "PATCH",
                                        headers: {
                                            "Content-Type": "application/json",
                                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                        },
                                        body: JSON.stringify(patchBody)
                                    });
                                    if (res.ok) {
                                        const updated = await res.json();
                                        // Refetch catalog and force reload NeedsOrdered page to guarantee sync
                                        await fetchCatalog();
                                        if (window.location.pathname === '/needs-ordered') {
                                            window.location.reload();
                                        } else {
                                            window.dispatchEvent(new Event('catalog-updated'));
                                        }
                                    }
                                }}
                            >
                                <option value="Good">Good</option>
                                <option value="Low">Low</option>
                                <option value="Very Low">Very Low</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
export default InventoryCatalog;