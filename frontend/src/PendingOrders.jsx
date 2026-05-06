import { useEffect, useState } from "react";
import api from "./api";
import socket from "./socket";
import { useNavigate } from "react-router-dom";

function PendingOrders() {
    const [pending, setPending] = useState([]);
    const navigate = useNavigate();

    const fetchPending = async () => {
        try {
            const res = await api.get("/api/catalog");
            const data = res.data;
            setPending(
                Array.isArray(data)
                    ? data.filter(
                        (item) => item.status && item.status.startsWith("Ordered by")
                    )
                    : []
            );
        } catch (err) {
            setPending([]);
        }
    };

    useEffect(() => {
        fetchPending();
        // Real-time update: update pending list on any itemOrdered event
        const handleItemOrdered = (updated) => {
            setPending((prev) => {
                // If the item is now ordered, add or update it in the list
                if (updated && updated.status && updated.status.startsWith("Ordered by")) {
                    // If already present, update; else add
                    const exists = prev.some((i) => i.id === updated.id);
                    if (exists) {
                        return prev.map((i) => (i.id === updated.id ? updated : i));
                    } else {
                        return [...prev, updated];
                    }
                } else {
                    // If the item is no longer ordered, remove it
                    return prev.filter((i) => i.id !== updated.id);
                }
            });
        };
        socket.on("itemOrdered", handleItemOrdered);
        return () => socket.off("itemOrdered", handleItemOrdered);
    }, []);

    const handleReceived = async (item) => {
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
            fetchPending();
        }
    };

    return (
        <div className="pending-orders">
            <h1>Pending Orders</h1>
            {pending.length === 0 ? (
                <p>No pending orders.</p>
            ) : (
                <div className="pending-list">
                    {pending.map((item) => (
                        <div key={item.id} className="pending-card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button
                                onClick={() => navigate(`/catalog/${item.id}`)}
                                style={{
                                    background: '#f5f5f5',
                                    border: '1px solid #bbb',
                                    borderRadius: 6,
                                    padding: '0.5rem 1.2rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    flex: 1,
                                    textAlign: 'left',
                                    minWidth: 0
                                }}
                                title="View item details"
                            >
                                <strong>{item.name}</strong>
                                <div style={{ fontWeight: 400, fontSize: 13, color: '#444' }}>{item.status}</div>
                            </button>
                            <button onClick={() => handleReceived(item)} style={{ background: '#388e3c', color: '#fff', fontWeight: 500 }}>
                                Received
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PendingOrders;
