import { useState } from "react";

function LoginForm({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Login failed");
                setLoading(false);
                return;
            }
            localStorage.setItem("token", data.token);
            if (onLogin) onLogin();
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="login-form" style={{ maxWidth: 340, margin: "2rem auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 30, height: "fit-content", padding: 24, border: "1px solid #ccc", borderRadius: 8 }}>
            <h2 style={{ marginBottom: 8, alignSelf: "center" }}>Login</h2>
            <input
                id="login-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                style={{ marginBottom: 8, width: "100%" }}
            />
            <input
                id="login-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ marginBottom: 12, width: "100%" }}
            />
            <button type="submit" disabled={loading} style={{ alignSelf: "stretch" }}>{loading ? "Logging in..." : "Login"}</button>
            {error && <div style={{ color: "#b00020", marginTop: 8 }}>{error}</div>}
        </form>
    );
}

export default LoginForm;
