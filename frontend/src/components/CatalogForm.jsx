import { useState } from "react";

export default function CatalogForm({ initialItem = {}, onSave }) {
    const [form, setForm] = useState({
        name: initialItem.name || "",
        catalog_number: initialItem.catalog_number || "",
        severity: initialItem.severity || "Good",
        default_location: initialItem.default_location || "",
        preferred_vendor: initialItem.preferred_vendor || "",
        purchase_url: initialItem.purchase_url || "",
        notes: initialItem.notes || "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSave(form);
    };

    return (
        <form onSubmit={handleSubmit} className="inventory-form">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Item Name" required />
            <input name="catalog_number" value={form.catalog_number} onChange={handleChange} placeholder="Catalog Number" />

            <select name="severity" value={form.severity} onChange={handleChange} required>
                <option value="Good">Good</option>
                <option value="Low">Low</option>
                <option value="Very Low">Very Low</option>
                <option value="Critical">Critical</option>
            </select>

            <input name="default_location" value={form.default_location} onChange={handleChange} placeholder="Location" />
            <input name="preferred_vendor" value={form.preferred_vendor} onChange={handleChange} placeholder="Preferred Vendor" />
            <input name="purchase_url" value={form.purchase_url} onChange={handleChange} placeholder="Purchase URL" />
            <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />

            <button type="submit">Save Item</button>
        </form>
    );
}
