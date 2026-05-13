import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderedButton from "./OrderedButton";
import DownloadCSVButton from "./DownloadCSVButton";
import api from "./api";
import socket from "./socket";
import "./App.css";

function NeedsOrdered() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("");
    const [filterSeverity, setFilterSeverity] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const fetchItems = async () => {
        try {
            const res = await api.get("/api/catalog");
            let data = res.data;
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
        } catch (err) {
            setItems([]);
            console.error("Failed to fetch items:", err);
        }
    };
    useEffect(() => {
        fetchItems();
        // Real-time update: update needs-ordered list on any itemOrdered event
        const handleItemOrdered = (updated) => {
            setItems((prev) => {
                // Should this item be in the Needs Ordered list?
                const isNeeded =
                    (updated.status === "Needs Ordered" || !updated.status) &&
                    (updated.severity === "Low" || updated.severity === "Very Low" || updated.severity === "Critical");
                const exists = prev.some((i) => i.id === updated.id);
                if (isNeeded) {
                    // Add or update
                    if (exists) {
                        return prev.map((i) => (i.id === updated.id ? updated : i));
                    } else {
                        return [...prev, updated];
                    }
                } else {
                    // Remove if present
                    return prev.filter((i) => i.id !== updated.id);
                }
            });
        };
        socket.on("itemOrdered", handleItemOrdered);
        return () => socket.off("itemOrdered", handleItemOrdered);
    }, []);

    const filteredItems = items.filter((item) => {
        const name = item.custom_material_name || item.name || "";
        return (
            (!filter || name.toLowerCase().includes(filter.toLowerCase())) &&
            (!filterSeverity || item.severity === filterSeverity)
        );
    });

    return (
        <>
            {/* Mobile menu button (not on home page) */}
            <button
                className="mobile-menu-btn"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                    display: 'none',
                    position: 'fixed',
                    top: 18,
                    left: 18,
                    zIndex: 2000,
                    background: 'transparent',
                    border: 'none',
                    fontSize: 32,
                    color: '#fff',
                    cursor: 'pointer',
                }}
            >
                <span role="img" aria-label="menu">{menuOpen ? '✖️' : '☰'}</span>
            </button>
            {/* Mobile nav menu */}
            <nav className={`mobile-nav-menu${menuOpen ? ' open' : ''}`}
                style={{
                    display: menuOpen ? 'flex' : 'none',
                    flexDirection: 'column',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(30,30,30,0.97)',
                    zIndex: 1999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 32,
                }}
            >
                <Link className="home-nav-btn" to="/" onClick={() => setMenuOpen(false)}>Home</Link>
                <Link className="home-nav-btn" to="/catalog" onClick={() => setMenuOpen(false)}>Inventory Catalog</Link>
                <Link className="home-nav-btn" to="/needs-ordered" onClick={() => setMenuOpen(false)}>Needs Ordered</Link>
                <Link className="home-nav-btn" to="/pending-orders" onClick={() => setMenuOpen(false)}>Pending Orders</Link>
            </nav>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 24, marginBottom: 16 }}>
                    <h1 style={{ margin: 0 }}>Needs Ordered</h1>
                    <DownloadCSVButton items={filteredItems} />
                </div>
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
                            <div className="card-url url-text">
                                URL: {item.purchase_url ? (
                                    <a
                                        href={item.purchase_url.startsWith('http') ? item.purchase_url : `https://${item.purchase_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {(() => {
                                            const url = item.purchase_url.startsWith('http') ? item.purchase_url : `https://${item.purchase_url}`;
                                            try {
                                                const { hostname } = new URL(url);
                                                return hostname;
                                            } catch {
                                                // fallback: show up to first slash or full string
                                                const noProto = url.replace(/^https?:\/\//, "");
                                                const idx = noProto.indexOf("/");
                                                return idx !== -1 ? noProto.slice(0, idx) : noProto;
                                            }
                                        })()}
                                    </a>
                                ) : (
                                    "N/A"
                                )}
                            </div>
                            {item.notes && <div className="card-notes">Notes: {item.notes}</div>}
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
                                                    const token = localStorage.getItem("token");
                                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog/${item.id}/status`, {
                                                        method: "PATCH",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                                        },
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
                                                    const receivedBy = window.prompt("Who received this item?");
                                                    if (!receivedBy) return;
                                                    const now = new Date().toISOString();
                                                    const token = localStorage.getItem("token");
                                                    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog/${item.id}`, {
                                                        method: "PATCH",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                                        },
                                                        body: JSON.stringify({ severity: "Good", delivered_on: now, received_by: receivedBy })
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
        </>
    );
}

export default NeedsOrdered;
