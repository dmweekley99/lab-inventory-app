
import { useState } from "react";
import api from "./api";


function GroupRegisterPage() {
    const [groupName, setGroupName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await api.post("/api/groups/register", {
                name: groupName,
                email,
                password
            });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to register group and owner user");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return <div>Your group and owner account have been registered and are pending approval.</div>;
    }

    return (
        <div style={{ maxWidth: 400, margin: "2rem auto" }}>
            <h2>Register a New Group</h2>
            <form onSubmit={handleSubmit}>
                <input
                    id="group-name"
                    name="group_name"
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Group Name"
                    required
                    style={{ width: "100%", marginBottom: 12 }}
                />
                <input
                    id="owner-email"
                    name="owner_email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Owner Email"
                    required
                    style={{ width: "100%", marginBottom: 12 }}
                />
                <input
                    id="owner-password"
                    name="owner_password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Owner Password"
                    required
                    style={{ width: "100%", marginBottom: 12 }}
                />
                <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register Group & Owner"}</button>
            </form>
            {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        </div>
    );
}

export default GroupRegisterPage;
