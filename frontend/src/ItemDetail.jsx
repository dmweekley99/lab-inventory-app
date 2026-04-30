
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import OrderedButton from "./OrderedButton";

function ItemDetail({ type }) {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const url = `http://localhost:5050/api/catalog/${id}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Item not found");
                const data = await res.json();
                setItem(data);
                setEditForm(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);


    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        const url = `http://localhost:5050/api/catalog/${id}`;
        const res = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editForm)
        });
        if (res.ok) {
            const updated = await res.json();
            setItem(updated);
            setEditMode(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!item) return <div>No item found.</div>;

    return (
        <div className="item-detail-container">
            <Link to="/">&larr; Back to Home</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h1 style={{ marginBottom: 0 }}>Item Details</h1>
                <button
                    title="Edit"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22 }}
                    onClick={() => setEditMode((m) => !m)}
                >
                    <span role="img" aria-label="edit">✏️</span>
                </button>
            </div>
            <div className="item-detail-card">
                {editMode ? (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <label><strong>Name: </strong></label>
                            <input name="custom_material_name" value={editForm.custom_material_name || editForm.name || ""} onChange={handleEditChange} />
                        </div>
                        {editForm.default_location !== undefined && (
                            <div style={{ marginBottom: 12 }}>
                                <label><strong>Location: </strong></label>
                                <input name="default_location" value={editForm.default_location || ""} onChange={handleEditChange} />
                            </div>
                        )}
                        {editForm.severity !== undefined && (
                            <div style={{ marginBottom: 12 }}>
                                <label><strong>Severity: </strong></label>
                                <input name="severity" value={editForm.severity || ""} onChange={handleEditChange} />
                            </div>
                        )}
                        {editForm.notes !== undefined && (
                            <div style={{ marginBottom: 12 }}>
                                <label><strong>Notes: </strong></label>
                                <input name="notes" value={editForm.notes || ""} onChange={handleEditChange} />
                            </div>
                        )}
                        {editForm.submitted_by !== undefined && (
                            <div style={{ marginBottom: 12 }}>
                                <label><strong>Submitted By: </strong></label>
                                <input name="submitted_by" value={editForm.submitted_by || ""} onChange={handleEditChange} />
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
                        <h2>{item.custom_material_name || item.name}</h2>
                        {item.location || item.default_location ? (
                            <p><strong>Location:</strong> {item.location || item.default_location}</p>
                        ) : null}
                        {item.severity && (
                            <p><strong>Severity:</strong> {item.severity}</p>
                        )}
                        {item.notes && (
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
    );
}

export default ItemDetail;
