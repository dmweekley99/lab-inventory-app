import { useState } from "react";
import api from "./api";
import GroupSelect from "./GroupSelect";

function RegisterForm({ onRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [groupId, setGroupId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await api.post("/api/auth/register", {
                email,
                password,
                group_id: groupId,
            });
            if (onRegister) onRegister();
        } catch (err) {
            setError(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: "2rem auto" }}>
            <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <GroupSelect value={groupId} onChange={e => setGroupId(e.target.value)} />
            </div>
            <form onSubmit={handleSubmit} className="register-form">
                <h2 className="main-title">Register</h2>
                <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
            </form>
        </div>
    );
}

export default RegisterForm;
