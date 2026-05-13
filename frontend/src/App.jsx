import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import InventoryCatalog from "./InventoryCatalog";
import ItemDetail from "./ItemDetail";
import NeedsOrdered from "./NeedsOrdered";
import PendingOrders from "./PendingOrders";
import OrdersPage from "./OrdersPage";
import LoginForm from "./LoginForm";
import GroupRegisterPage from "./GroupRegisterPage";
import RegisterForm from "./RegisterForm";
import AdminGroupApprovalPage from "./AdminGroupApprovalPage";
import { useAuth } from "./AuthContext";
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
    // Always show login/register/group-register if not authenticated
    return (
      <div className="login-outer-container">
        <div className="login-bg-box" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <nav style={{ marginBottom: 24, display: "flex", gap: 16, justifyContent: "center", alignItems: "center", width: "100%" }}>
            {navButton("/", "Login")}
            {navButton("/register", "Register")}
            {navButton("/group-register", "Register Group")}
          </nav>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Routes>
              <Route path="/register" element={<RegisterForm onRegister={() => navigate("/")} />} />
              <Route path="/group-register" element={<GroupRegisterPage />} />
              <Route path="*" element={<LoginForm onLogin={() => navigate("/")} />} />
            </Routes>
          </div>
        </div>
      </div>
    );
  }

  // Helper to check admin role from JWT
  const isAdmin = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role === "admin";
    } catch {
      return false;
    }
  };

  return (
    <div className="app-container" style={{ position: "relative" }}>
      {/* Admin-only button in top right */}
      {isAuthenticated && isAdmin() && (
        <Link
          to="/admin/group-approval"
          style={{
            position: "absolute",
            top: 12,
            right: 120,
            zIndex: 1000,
            background: "#1976d2",
            color: "white",
            padding: "8px 16px",
            borderRadius: 4,
            textDecoration: "none",
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "background 0.2s"
          }}
        >
          Admin Group Approval
        </Link>
      )}
      <button
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
      {/* Only show nav bar at the top for non-home pages */}
      {location.pathname !== "/" && (
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem", justifyContent: "center", margin: "2.5rem auto 0 auto" }}>
          {navButton("/", "Home")}
          {navButton("/catalog", "Inventory Catalog")}
          {navButton("/needs-ordered", "Needs Ordered")}
          {navButton("/pending-orders", "Pending Orders")}
          {navButton("/orders", "Orders")}
        </nav>
      )}
      <Routes>
        {/* Only allow access to admin group approval page if user is admin */}
        {isAuthenticated && JSON.parse(atob(localStorage.getItem("token").split(".")[1])).role === "admin" && (
          <Route path="/admin/group-approval" element={<AdminGroupApprovalPage />} />
        )}
        <Route
          path="/"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
              <h1>Jupiter App </h1>
              <h1>Inventory System</h1>
              <nav style={{ display: "flex", alignItems: "center", gap: "2rem", justifyContent: "center", margin: "2.5rem auto 0 auto" }}>
                {navButton("/", "Home")}
                {navButton("/catalog", "Inventory Catalog")}
                {navButton("/needs-ordered", "Needs Ordered")}
                {navButton("/pending-orders", "Pending Orders")}
                {navButton("/orders", "Orders")}
              </nav>
            </div>
          }
        />
        <Route path="/catalog" element={<InventoryCatalog />} />
        <Route path="/needs-ordered" element={<NeedsOrdered />} />
        <Route path="/pending-orders" element={<PendingOrders />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/catalog/:id" element={<ItemDetail type="catalog" />} />
      </Routes>
    </div>
  );
}

export default App;