

import { Routes, Route, Link, useNavigate } from "react-router-dom";
import InventoryCatalog from "./InventoryCatalog";
import ItemDetail from "./ItemDetail";
import NeedsOrdered from "./NeedsOrdered";
import LoginForm from "./LoginForm";
import "./App.css";



function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  if (!token) {
    // Always show login form if not authenticated, block all other routes
    return (
      <div className="app-container">
        <LoginForm onLogin={() => navigate("/catalog")} />
      </div>
    );
  }

  return (
    <div className="app-container" style={{ position: "relative" }}>
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: 12,
          right: 18,
          padding: "0.2rem 0.7rem",
          fontSize: "0.85rem",
          borderRadius: 4,
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          zIndex: 10
        }}
        aria-label="Log Out"
      >
        Log Out
      </button>
      <nav style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link to="/">Home</Link> | {" "}
        <Link to="/catalog">Inventory Catalog</Link> | {" "}
        <Link to="/needs-ordered">Needs Ordered</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
              <h1>Jupiter App </h1>
              <h1>Inventory System</h1>
              <div className="home-nav-btn-container" style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", width: "100%", maxWidth: 400 }}>
                <button className="home-nav-btn" onClick={() => navigate("/catalog")}>Inventory Catalog</button>
                <button className="home-nav-btn" onClick={() => navigate("/needs-ordered")}>Needs Ordered</button>
              </div>
            </div>
          }
        />
        <Route path="/catalog" element={<InventoryCatalog />} />
        <Route path="/needs-ordered" element={<NeedsOrdered />} />
        <Route path="/catalog/:id" element={<ItemDetail type="catalog" />} />
      </Routes>
    </div>
  );
}

export default App;