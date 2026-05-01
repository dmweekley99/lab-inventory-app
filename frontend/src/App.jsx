
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import InventoryCatalog from "./InventoryCatalog";
import ItemDetail from "./ItemDetail";
import NeedsOrdered from "./NeedsOrdered";
import LoginForm from "./LoginForm";
import "./App.css";

function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/">Home</Link> | {" "}
        <Link to="/catalog">Inventory Catalog</Link> | {" "}
        <Link to="/needs-ordered">Needs Ordered</Link>
      </nav>
      <Routes>
        <Route
          path="/login"
          element={<LoginForm onLogin={() => navigate("/catalog")} />} />
        <Route
          path="/"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
              <h1>Jupiter App - Inventory System</h1>
              <div className="home-nav-btn-container" style={{ display: "flex", gap: "2rem", marginTop: "2.5rem", width: "100%", maxWidth: 400 }}>
                <button className="home-nav-btn" onClick={() => navigate("/catalog")}>Inventory Catalog</button>
                <button className="home-nav-btn" onClick={() => navigate("/needs-ordered")}>Needs Ordered</button>
              </div>
            </div>
          }
        />
        <Route path="/catalog" element={<RequireAuth><InventoryCatalog /></RequireAuth>} />
        <Route path="/needs-ordered" element={<RequireAuth><NeedsOrdered /></RequireAuth>} />
        <Route path="/catalog/:id" element={<RequireAuth><ItemDetail type="catalog" /></RequireAuth>} />
      </Routes>
    </div>
  );
}

export default App;