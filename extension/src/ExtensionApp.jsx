import { useState } from "react";
import CatalogForm from "../../frontend/src/components/CatalogForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function ExtensionApp() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState("new"); // "new" or "edit"

  const login = async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) setToken(data.token);
    else alert(data.error || "Login failed");
  };

  const saveItem = async (form) => {
    await fetch(`${API_URL}/api/catalog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });
    alert("Item saved");
  };

  if (!token) {
    return (
      <div className="extension-popup">
        <h2>Jupiter Catalog</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div className="extension-popup">
      <div style={{ display: 'flex', borderBottom: '1px solid #444', marginBottom: 12 }}>
        <button
          style={{
            flex: 1,
            background: tab === 'new' ? '#222' : 'transparent',
            color: tab === 'new' ? '#fff' : '#aaa',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            borderBottom: tab === 'new' ? '2px solid #ff9800' : 'none',
          }}
          onClick={() => setTab('new')}
        >
          New
        </button>
        <button
          style={{
            flex: 1,
            background: tab === 'edit' ? '#222' : 'transparent',
            color: tab === 'edit' ? '#fff' : '#aaa',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            borderBottom: tab === 'edit' ? '2px solid #ff9800' : 'none',
          }}
          onClick={() => setTab('edit')}
        >
          Edit
        </button>
      </div>
      {tab === 'new' && (
        <>
          <h2>New Catalog Item</h2>
          <CatalogForm onSave={saveItem} />
        </>
      )}
      {tab === 'edit' && (
        <div style={{ color: '#aaa', textAlign: 'center', marginTop: 32 }}>
          Edit functionality coming soon...
        </div>
      )}
    </div>
  );
}
