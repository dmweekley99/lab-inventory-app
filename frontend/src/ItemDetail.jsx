
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

function ItemDetail({ type }) {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                let url = type === "catalog"
                    ? `http://localhost:5050/api/catalog/${id}`
                    : `http://localhost:5050/api/requests/${id}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Item not found");
                const data = await res.json();
                setItem(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id, type]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!item) return <div>No item found.</div>;

    return (
        <div className="item-detail-container">
            <Link to="/">&larr; Back to Home</Link>
            <h1>Item Details</h1>
            <div className="item-detail-card">
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
                {item.category && (
                    <p><strong>Category:</strong> {item.category}</p>
                )}
                {item.preferred_vendor && (
                    <p><strong>Preferred Vendor:</strong> {item.preferred_vendor}</p>
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
            </div>
        </div>
    );
}

export default ItemDetail;
