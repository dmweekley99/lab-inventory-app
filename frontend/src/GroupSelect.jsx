import { useEffect, useState } from "react";
import api from "./api";

function GroupSelect({ value, onChange }) {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await api.get("/api/groups/approved");
                setGroups(res.data);
            } catch {
                setGroups([]);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    // Hide admin group (id 3) from dropdown
    const visibleGroups = groups.filter((g) => g.id !== 3);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <select value={value} onChange={onChange} required>
                <option value="">Select Group</option>
                {visibleGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
            <input
                type="number"
                min="1"
                placeholder="Or enter group ID manually"
                value={value && !visibleGroups.some(g => g.id === Number(value)) ? value : ''}
                onChange={onChange}
                style={{ fontSize: '1rem', padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc' }}
            />
        </div>
    );
}

export default GroupSelect;
