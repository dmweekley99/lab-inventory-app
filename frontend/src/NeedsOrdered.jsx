import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderedButton from "./OrderedButton";
import "./App.css";

function NeedsOrdered() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("");

    const fetchItems = async () => {
        const res = await fetch("http://localhost:5050/api/catalog");
        let data = await res.json();
        data = Array.isArray(data)
            ? data.filter(
                (item) =>
                    (item.status === "Needs Ordered" || !item.status) &&
                    (item.severity === "Low" ||
                        item.severity === "Very Low" ||
                        item.severity === "Critical")
            )
            : [];
        setItems(data);
    };
    useEffect(() => {
        fetchItems();
        const handler = () => fetchItems();
        window.addEventListener('catalog-updated', handler);
        return () => {
            window.removeEventListener('catalog-updated', handler);
        };
    }, []);

    const filteredItems = items.filter((item) => {
        const name = item.custom_material_name || item.name || "";
        return (
            (!filter || name.toLowerCase().includes(filter.toLowerCase())) &&
            (!filterSeverity || item.severity === filterSeverity)
        );
    });

    return (
        <div>
            <h1>Needs Ordered</h1>
            <div style={{ margin: "1em 0" }}>
                <input
                    type="text"
                    placeholder="Filter by name..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ marginRight: 8 }}
                />
                <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                >
                    <option value="">All Severities</option>
                    <option value="Low">Low</option>
                    <option value="Very Low">Very Low</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            <div className="inventory-catalog-cards" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
                {filteredItems.length === 0 && (
                    <div style={{ color: "#b0b3b8" }}>No items need ordering.</div>
                )}
                {filteredItems.map((item) => (
                    <div
                        className="inventory-card"
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={e => {
                            // Prevent navigation if a button or link is clicked
                            if (
                                e.target.tagName === 'BUTTON' ||
                                e.target.tagName === 'A' ||
                                e.target.closest('button') ||
                                e.target.closest('a')
                            ) return;
                            window.location.href = `/catalog/${item.id}`;
                        }}
                    >
                        <div className="card-title">
                            {item.custom_material_name || item.name}
                        </div>
                        <div className="card-severity">
                            Severity: {item.severity || "N/A"}
                        </div>
                        <div className="card-catalog-number">
                            Catalog Number: {item.catalog_number || item.catalog_number === "" ? item.catalog_number : (item.catalog_number === undefined ? (item.name ? "N/A" : "") : "N/A")}
                        </div>
                        <div className="card-url">
                            URL: {item.purchase_url ? (
                                <a href={item.purchase_url.startsWith('http') ? item.purchase_url : `https://${item.purchase_url}`} target="_blank" rel="noopener noreferrer">{item.purchase_url}</a>
                            ) : (
                                "N/A"
                            )}
                        </div>
                        {item.ordered_on && (
                            <div style={{ color: '#388e3c', fontWeight: 500, marginBottom: 4 }}>
                                Last Ordered On: {new Date(item.ordered_on).toLocaleString()}
                            </div>
                        )}
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                            {item.status && item.status.startsWith('Ordered by') ? (
                                <>
                                    <span style={{ color: 'green', fontWeight: 500 }}>{item.status}</span>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                        <button
                                            style={{ background: '#fbc02d', color: '#222', fontWeight: 500 }}
                                            onClick={async () => {
                                                // Undo: set status to Needs Ordered
                                                const res = await fetch(`http://localhost:5050/api/catalog/${item.id}/status`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ status: "Needs Ordered" })
                                                });
                                                if (res.ok) {
                                                    const updated = await res.json();
                                                    setItems(items => items.map(i => i.id === updated.id ? updated : i));
                                                }
                                            }}
                                        >Undo</button>
                                        <button
                                            style={{ background: '#388e3c', color: '#fff', fontWeight: 500 }}
                                            onClick={async () => {
                                                // Set severity to Good and update delivered_on timestamp
                                                const now = new Date().toISOString();
                                                const res = await fetch(`http://localhost:5050/api/catalog/${item.id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ severity: "Good", delivered_on: now })
                                                });
                                                if (res.ok) {
                                                    fetchItems();
                                                }
                                            }}
                                        >Received</button>
                                    </div>
                                </>
                            ) : (
                                <OrderedButton item={item} onOrdered={updated => setItems(items => items.map(i => i.id === updated.id ? updated : i))} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default NeedsOrdered;
