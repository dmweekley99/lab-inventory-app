import { useEffect, useState } from "react";
import api from "./api";

function OrdersPage() {
    const [filters, setFilters] = useState({
        ordered_by: "",
        received_by: "",
        ordered_on: "",
        delivered_on: "",
        name: ""
    });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) params.append(k, v);
        });
        const res = await api.get(`/api/orders?${params.toString()}`);
        console.log("Orders API response:", res.data);
        setOrders(res.data);
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, []); // initial load

    const handleChange = e => {
        setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleFilter = e => {
        e.preventDefault();
        fetchOrders();
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v) params.append(k, v);
        });
        window.open(`/api/orders/export?${params.toString()}`);
    };

    return (
        <div>
            <h2>Orders</h2>
            <form onSubmit={handleFilter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <input name="ordered_by" placeholder="Ordered By" value={filters.ordered_by} onChange={handleChange} />
                <input name="received_by" placeholder="Received By" value={filters.received_by} onChange={handleChange} />
                <input name="ordered_on" type="date" placeholder="Ordered On" value={filters.ordered_on} onChange={handleChange} />
                <input name="delivered_on" type="date" placeholder="Delivered On" value={filters.delivered_on} onChange={handleChange} />
                <input name="name" placeholder="Item Name" value={filters.name} onChange={handleChange} />
                <button type="submit">Filter</button>
                <button type="button" onClick={handleExport}>Export to CSV</button>
            </form>
            {loading ? <div>Loading...</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Item Name</th>
                            <th>Ordered By</th>
                            <th>Received By</th>
                            <th>Ordered On</th>
                            <th>Delivered On</th>
                            <th>Price Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.name}</td>
                                <td>{order.ordered_by}</td>
                                <td>{order.received_by}</td>
                                <td>{order.ordered_on ? new Date(order.ordered_on).toLocaleDateString() : ""}</td>
                                <td>{order.delivered_on ? new Date(order.delivered_on).toLocaleDateString() : ""}</td>
                                <td>{order.price_paid}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default OrdersPage;
