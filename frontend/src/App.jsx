import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({
    custom_material_name: "",
    location: "",
    severity: "Low",
    notes: "",
    submitted_by: ""
  });

  const fetchMaterials = async () => {
    const res = await fetch("http://localhost:5050/api/requests");
    const data = await res.json();
    setMaterials(data);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5050/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    setForm({
      custom_material_name: "",
      location: "",
      severity: "Low",
      notes: "",
      submitted_by: ""
    });

    fetchMaterials();
  };

  const handleSeverityChange = async (id, severity) => {
    const res = await fetch(`http://localhost:5050/api/requests/${id}/severity`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ severity }),
    });

    if (!res.ok) {
      console.error("Failed to update severity");
      return;
    }

    fetchMaterials();
  };

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5050/api/requests/${id}`, {
      method: "DELETE"
    });

    fetchMaterials();
  };

  return (
    <div className="app-container">
      <h1>Inventory Requests</h1>

      <form onSubmit={handleSubmit} className="form-stacked">
        <div className="form-row">
          <input
            placeholder="Material name"
            value={form.custom_material_name}
            onChange={(e) =>
              setForm({ ...form, custom_material_name: e.target.value })
            }
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="Good">Good</option>
            <option value="Low">Low</option>
            <option value="Very Low">Very Low</option>
            <option value="Critical">Critical</option>
          </select>
          <input
            placeholder="Your name"
            value={form.submitted_by}
            onChange={(e) =>
              setForm({ ...form, submitted_by: e.target.value })
            }
          />
        </div>
        <div className="form-row">
          <input
            className="notes-input"
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button type="submit">Submit</button>
        </div>
      </form>

      <h2>Needs Ordered</h2>

      <ul>
        {materials.map((material) => (
          <div className="card" key={material.id}>
            <div className="card-content card-content-custom">
              <div className="card-side-info">
                <p className="location-label">{material.location}</p>
                <span className={`badge ${material.severity.toLowerCase()}`}>{material.severity}</span>
              </div>
              <div className="card-text-centered">
                <h3>{material.custom_material_name || material.name}</h3>
              </div>
              <div className="card-actions">
                <select
                  value={material.severity}
                  onChange={(e) =>
                    handleSeverityChange(material.id, e.target.value)
                  }
                >
                  <option value="Good">Good</option>
                  <option value="Low">Low</option>
                  <option value="Very Low">Very Low</option>
                  <option value="Critical">Critical</option>
                </select>
                <button onClick={() => handleDelete(material.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </ul>
    </div >
  );
}

export default App;