import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import OrderedButton from "./OrderedButton";
import api from "./api";
import socket from "./socket";

function ItemDetail({ type }) {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const res = await api.get(`/api/catalog/${id}`);
                const data = res.data;
                setItem(data);
                setEditForm(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();

        // Listen for real-time updates to this item
        const handleItemOrdered = (updated) => {
            if (updated && updated.id && String(updated.id) === String(id)) {
                setItem(updated);
            }
        };
        socket.on("itemOrdered", handleItemOrdered);
        return () => {
            socket.off("itemOrdered", handleItemOrdered);
        };
    }, [id]);


    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        try {
            const res = await api.patch(`/api/catalog/${id}`, editForm);
            if (res.status === 200) {
                setItem(res.data);
                setEditMode(false);
            }
        } catch (err) {
            setError("Failed to update item");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!item) return <div>No item found.</div>;

    const handleOrdered = (updatedItem) => {
        setItem(updatedItem);
        window.dispatchEvent(new Event('catalog-updated'));
    };


    return (
        <>
            {/* Mobile menu button and nav, only for mobile (hidden on desktop via CSS) */}
            <div className="mobile-menu-bar">
                <button
                    className="mobile-menu-btn"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    onClick={() => setMenuOpen((v) => !v)}
                >
                    <span role="img" aria-label="menu">{menuOpen ? '✖️' : '☰'}</span>
                </button>
            </div>
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
            <div className="item-detail-container">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <h1 style={{ marginBottom: 0 }}>Item Details</h1>
                </div>
                {item && (
                    <div style={{ margin: '16px 0', minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
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
                                                setItem(updated);
                                                window.dispatchEvent(new Event('catalog-updated'));
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
                                                body: JSON.stringify({ severity: "Good", delivered_on: now, status: "Needs Ordered", received_by: receivedBy })
                                            });
                                            if (res.ok) {
                                                // Re-fetch the item to ensure state is up to date
                                                const refetch = await fetch(`${import.meta.env.VITE_API_URL}/api/catalog/${item.id}`, {
                                                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                                                });
                                                if (refetch.ok) {
                                                    const updated = await refetch.json();
                                                    setItem(updated);
                                                }
                                                window.dispatchEvent(new Event('catalog-updated'));
                                            }
                                        }}
                                    >Received</button>
                                </div>
                            </>
                        ) : (
                            <OrderedButton item={item} onOrdered={handleOrdered} />
                        )}
                    </div>
                )}
                <div className="item-detail-card">
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minHeight: 40, marginBottom: 8 }}>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {editMode ? (
                                <div style={{ marginBottom: 0, marginRight: 8 }}>
                                    <label><strong>Name: </strong></label>
                                    <input name="name" value={editForm.name || ""} onChange={handleEditChange} />
                                </div>
                            ) : (
                                <h2 style={{ marginBottom: 0, textAlign: 'center' }}>{item.name}</h2>
                            )}
                        </div>
                        <button
                            title="Edit"
                            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
                            onClick={() => setEditMode((m) => !m)}
                        >
                            <span role="img" aria-label="edit">✏️</span>
                        </button>
                    </div>
                    {editMode ? (
                        <>
                            {editForm.default_location !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Location: </strong></label>
                                    <input name="default_location" value={editForm.default_location || ""} onChange={handleEditChange} />
                                </div>
                            )}
                            {editForm.severity !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Severity: </strong></label>
                                    <select name="severity" value={editForm.severity || ""} onChange={handleEditChange}>
                                        <option value="Good">Good</option>
                                        <option value="Low">Low</option>
                                        <option value="Very Low">Very Low</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            )}
                            {editForm.notes !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Notes: </strong></label>
                                    <input name="notes" value={editForm.notes || ""} onChange={handleEditChange} />
                                </div>
                            )}
                            {editForm.catalog_number !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Catalog Number: </strong></label>
                                    <input name="catalog_number" value={editForm.catalog_number || ""} onChange={handleEditChange} />
                                </div>
                            )}
                            {editForm.preferred_vendor !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Preferred Vendor: </strong></label>
                                    <input name="preferred_vendor" value={editForm.preferred_vendor || ""} onChange={handleEditChange} />
                                </div>
                            )}
                            {editForm.purchase_url !== undefined && (
                                <div style={{ marginBottom: 12 }}>
                                    <label><strong>Purchase URL: </strong></label>
                                    <input name="purchase_url" value={editForm.purchase_url || ""} onChange={handleEditChange} />
                                </div>
                            )}
                            <button onClick={handleEditSave} style={{ background: '#1976d2', color: '#fff', marginRight: 8 }}>Save</button>
                            <button onClick={() => setEditMode(false)} style={{ background: '#b0b3b8', color: '#222' }}>Cancel</button>
                        </>
                    ) : (
                        <>
                            {item.location || item.default_location ? (
                                <p><strong>Location:</strong> {item.location || item.default_location}</p>
                            ) : null}
                            {item.severity && (
                                <p><strong>Severity:</strong> {item.severity}</p>
                            )}
                            {item.ordered_by && item.ordered_by.trim() !== "" && (
                                <p><strong>Last Ordered By:</strong> {item.ordered_by}</p>
                            )}
                            {item.received_by && item.received_by.trim() !== "" && (
                                <p><strong>Last Received By:</strong> {item.received_by}</p>
                            )}
                            {item.notes && item.notes.trim() !== "" && (
                                <p><strong>Notes:</strong> {item.notes}</p>
                            )}
                            {item.submitted_by && (
                                <p><strong>Submitted By:</strong> {item.submitted_by}</p>
                            )}
                            {item.catalog_number && (
                                <p><strong>Catalog Number:</strong> {item.catalog_number}</p>
                            )}
                            {item.preferred_vendor && (
                                <p><strong>Preferred Vendor:</strong> {item.preferred_vendor}</p>
                            )}
                            {item.ordered_on && (
                                <p><strong>Ordered On:</strong> {new Date(item.ordered_on).toLocaleString()}</p>
                            )}
                            {item.delivered_on && (
                                <p><strong>Delivered On:</strong> {new Date(item.delivered_on).toLocaleString()}</p>
                            )}
                            {item.purchase_url && (
                                <p><strong>Purchase URL:</strong> {(() => {
                                    let url = item.purchase_url;
                                    if (url && !/^https?:\/\//i.test(url)) {
                                        url = 'https://' + url;
                                    }
                                    return <a href={url} target="_blank" rel="noopener noreferrer">{item.purchase_url}</a>;
                                })()}</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
export default ItemDetail;
