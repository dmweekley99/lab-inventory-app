import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";

function InventoryRequests() {
    const [materials, setMaterials] = useState([]);
    const [form, setForm] = useState({
        custom_material_name: "",
        location: "",
        severity: "",
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });
        setForm({
            custom_material_name: "",
            location: "",
            severity: "",
            notes: "",
            submitted_by: ""
        });
        fetchMaterials();
    };

    const handleSeverityChange = async (id, severity) => {
        const res = await fetch(`http://localhost:5050/api/requests/${id}/severity`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ severity })
        });
        if (!res.ok) {
            console.error("Failed to update severity");
            return;
        }
        fetchMaterials();
    };

    const handleDelete = async (id) => {
        await fetch(`http://localhost:5050/api/requests/${id}`, { method: "DELETE" });
        fetchMaterials();
    };

    return (
        <div>
            <h1>Inventory Requests</h1>
            <form onSubmit={handleSubmit} className="form-stacked">
                <div className="form-row">
                    <input
                        id="request-material-name"
                        name="custom_material_name"
                        autoComplete="off"
                        placeholder="Material name"
                        value={form.custom_material_name}
                        onChange={(e) => setForm({ ...form, custom_material_name: e.target.value })}
                    />
                    <input
                        id="request-location"
                        name="location"
                        autoComplete="off"
                        placeholder="Location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                    <select
                        id="request-severity"
                        name="severity"
                        autoComplete="off"
                        value={form.severity}
                        onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    >
                        <option value="">Select Severity</option>
                        <option value="Good">Good</option>
                        <option value="Low">Low</option>
                        <option value="Very Low">Very Low</option>
                        <option value="Critical">Critical</option>
                    </select>
                    <input
                        id="request-submitted-by"
                        name="submitted_by"
                        autoComplete="off"
                        placeholder="Your name"
                        value={form.submitted_by}
                        onChange={(e) => setForm({ ...form, submitted_by: e.target.value })}
                    />
                </div>
                <div className="form-row">
                    <input
                        id="request-notes"
                        name="notes"
                        className="notes-input"
                        autoComplete="off"
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
                        <Link to={`/requests/${material.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="card-content card-content-custom">
                                <div className="card-side-info">
                                    <p className="location-label">{material.location}</p>
                                    <span className={`badge ${material.severity ? material.severity.toLowerCase() : "unknown"}`}>{material.severity || "Unknown"}</span>
                                </div>
                                <div className="card-text-centered">
                                    <h3>{material.custom_material_name || material.name}</h3>
                                </div>
                            </div>
                        </Link>
                        <div className="card-actions">
                            <select
                                value={material.severity || ""}
                                onChange={(e) => handleSeverityChange(material.id, e.target.value)}
                            >
                                <option value="">Select Severity</option>
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
                ))}
            </ul>
        </div>
    );
}

export default InventoryRequests;
