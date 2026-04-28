import { Routes, Route, Link, useNavigate } from "react-router-dom";
import InventoryCatalog from "./InventoryCatalog";
import InventoryRequests from "./InventoryRequests";
import ItemDetail from "./ItemDetail";
import "./App.css";

function App() {
  const navigate = useNavigate();
  return (
    <div className="app-container">
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/">Home</Link> | {" "}
        <Link to="/requests">Inventory Requests</Link> | {" "}
        <Link to="/catalog">Inventory Catalog</Link>
      </nav>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
              <h1>Lab Inventory App</h1>
              <div style={{ display: "flex", gap: "2rem", marginTop: "2.5rem" }}>
                <button className="home-nav-btn" onClick={() => navigate("/requests")}>Inventory Requests</button>
                <button className="home-nav-btn" onClick={() => navigate("/catalog")}>Inventory Catalog</button>
              </div>
            </div>
          }
        />
        <Route path="/requests" element={<InventoryRequests />} />
        <Route path="/catalog" element={<InventoryCatalog />} />
        <Route path="/requests/:id" element={<ItemDetail type="request" />} />
        <Route path="/catalog/:id" element={<ItemDetail type="catalog" />} />
      </Routes>
    </div>
  );
}

export default App;