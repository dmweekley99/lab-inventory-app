import { Routes, Route, Link, useNavigate } from "react-router-dom";
import InventoryCatalog from "./InventoryCatalog";

import ItemDetail from "./ItemDetail";
import NeedsOrdered from "./NeedsOrdered";
import "./App.css";

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
          path="/"
          element={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4rem" }}>
              <h1>Lab Inventory</h1>
              <div style={{ display: "flex", gap: "2rem", marginTop: "2.5rem" }}>
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