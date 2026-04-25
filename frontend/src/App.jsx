import { useEffect, useState } from "react";

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

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory Requests</h1>

      <form onSubmit={handleSubmit}>
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
          <option>Good</option>
          <option>Low</option>
          <option>Very Low</option>
          <option>Critical</option>
        </select>

        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <input
          placeholder="Your name"
          value={form.submitted_by}
          onChange={(e) =>
            setForm({ ...form, submitted_by: e.target.value })
          }
        />

        <button type="submit">Submit</button>
      </form>

      <h2>Needs Ordered</h2>

      <ul>
        {materials.map((m) => (
          <li key={m.id}>
            {m.material_name} — {m.location} — {m.severity} — {m.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;