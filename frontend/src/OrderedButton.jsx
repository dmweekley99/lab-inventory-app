import { useState } from "react";

function OrderedButton({ item, onOrdered }) {
    const [ordering, setOrdering] = useState(false);

    const handleOrdered = async () => {
        const user = window.prompt("Who is ordering this item?");
        if (!user) return;
        setOrdering(true);
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const status = `Ordered by ${user} on ${dateStr}`;
        const ordered_on = now.toISOString();
        const ordered_by = user;
        const res = await fetch(`http://localhost:5050/api/catalog/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, ordered_on, ordered_by })
        });
        if (res.ok) {
            const updated = await res.json();
            onOrdered(updated);
        }
        setOrdering(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <button onClick={handleOrdered} disabled={ordering} style={{ background: '#1976d2', color: '#fff' }}>
                {ordering ? "Ordering..." : "Ordered"}
            </button>
        </div>
    );
}

export default OrderedButton;
