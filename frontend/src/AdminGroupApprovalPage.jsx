import { useEffect, useState } from "react";
import api from "./api";

function AdminGroupApprovalPage() {
    const [pendingGroups, setPendingGroups] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchPending = async () => {
        setError("");
        try {
            const res = await api.get("/api/groups/pending");
            setPendingGroups(res.data);
        } catch (err) {
            setError("Failed to fetch pending groups");
        }
    };

    useEffect(() => { fetchPending(); }, []);

    const approveGroup = async (name) => {
        setError("");
        setMessage("");
        try {
            await api.post("/api/groups/approve", { name });
            setMessage(`Approved group: ${name}`);
            setPendingGroups(pendingGroups.filter(g => g.name !== name));
        } catch (err) {
            setError(err.response?.data?.error || "Failed to approve group");
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "2rem auto" }}>
            <h2>Pending Group Approvals</h2>
            {message && <div style={{ color: "green" }}>{message}</div>}
            {error && <div style={{ color: "red" }}>{error}</div>}
            <ul>
                {!error && pendingGroups.length === 0 && <li>No pending groups.</li>}
                {pendingGroups.map(g => (
                    <li key={g.id} style={{ marginBottom: 12 }}>
                        <span>{g.name}</span>
                        <button style={{ marginLeft: 16 }} onClick={() => approveGroup(g.name)}>Approve</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default AdminGroupApprovalPage;
