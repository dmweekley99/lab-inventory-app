import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";

import InventoryCatalog from "./InventoryCatalog";
import ItemDetail from "./ItemDetail";
import NeedsOrdered from "./NeedsOrdered";
import PendingOrders from "./PendingOrders";
import LoginForm from "./LoginForm";
import { useAuth } from "./AuthContext";
import DesktopNavBar from "./DesktopNavBar";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  // Helper for nav button
  const navButton = (to, label) => (
    <Link
      className="top-nav-btn"
      to={to}
      style={{
        pointerEvents: location.pathname === to ? "none" : "auto",
        background: location.pathname === to ? "#aaa" : "#ffbe57",
        color: location.pathname === to ? "#222" : "#222",
        cursor: location.pathname === to ? "default" : "pointer",
      }}
      aria-current={location.pathname === to ? "page" : undefined}
      tabIndex={location.pathname === to ? -1 : 0}
    >
      {label}
    </Link>
  );

  if (!isAuthenticated) {
    // Always show login form if not authenticated, block all other routes
    return (
      <div className="login-outer-container">
        <div className="login-bg-box">
          <LoginForm onLogin={() => navigate("/")} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-main-container">
      <div className="app-container" style={{ position: "relative" }}>
        <button
          className="logout-btn"
          onClick={logout}
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
            zIndex: 10,
          }}
          aria-label="Log Out"
        >
          Log Out
        </button>
        {/* Desktop nav bar on all pages except home */}
        {location.pathname !== "/" && (
          <div className="desktop-nav-bar-container">
            <DesktopNavBar />
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
                <h1>Jupiter App </h1>
                <h1>Inventory System</h1>
                <nav className="home-nav-btn-container" style={{ display: "flex", alignItems: "center", gap: "2rem", justifyContent: "center", margin: "2.5rem auto 0 auto" }}>
                  <Link className="home-nav-btn" to="/catalog">Inventory Catalog</Link>
                  <Link className="home-nav-btn" to="/needs-ordered">Needs Ordered</Link>
                  <Link className="home-nav-btn" to="/pending-orders">Pending Orders</Link>
                </nav>
              </div>
            }
          />
          <Route path="/catalog" element={<InventoryCatalog />} />
          <Route path="/needs-ordered" element={<NeedsOrdered />} />
          <Route path="/pending-orders" element={<PendingOrders />} />
          <Route path="/catalog/:id" element={<ItemDetail type="catalog" />} />
        </Routes>
      </div>
    </div>
  );
}
export default App;