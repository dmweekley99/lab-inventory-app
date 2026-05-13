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

    return (
        <select value={value} onChange={onChange} required>
            <option value="">Select Group</option>
            {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
            ))}
        </select>
    );
}

export default GroupSelect;
