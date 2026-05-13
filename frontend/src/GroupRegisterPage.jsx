import { useState } from "react";
import api from "./api";
import GroupSelect from "./GroupSelect";

function GroupRegisterPage() {
    const [groupName, setGroupName] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post("/api/groups/register", { name: groupName });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to submit group request");
        }
    };

    if (submitted) {
        return <div>Your group registration request has been submitted and is pending approval.</div>;
    }

    return (
        <div style={{ maxWidth: 400, margin: "2rem auto" }}>
            <h2>Register a New Group</h2>
            <form onSubmit={handleSubmit}>
                <input
                    id="group-name"
                    name="group_name"
                    type="text"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    placeholder="Group Name"
                    required
                    style={{ width: "100%", marginBottom: 12 }}
                />
                <button type="submit">Submit for Approval</button>
            </form>
            {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        </div>
    );
}

export default GroupRegisterPage;
