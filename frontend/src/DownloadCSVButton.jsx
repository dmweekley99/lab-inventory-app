import React from "react";

function convertToCSV(items) {
    if (!items.length) return "";
    // Define the columns you want in the CSV
    const columns = [
        { key: "name", label: "Name" },
        { key: "severity", label: "Severity" },
        { key: "catalog_number", label: "Catalog Number" },
        { key: "purchase_url", label: "Purchase URL" },
        { key: "ordered_on", label: "Last Ordered On" },
        { key: "status", label: "Status" },
    ];
    const header = columns.map(col => col.label).join(",");
    const rows = items.map(item =>
        columns.map(col => {
            let value = item[col.key];
            if (col.key === "ordered_on" && value) {
                value = new Date(value).toLocaleString();
            }
            // Escape quotes and commas
            if (typeof value === "string") {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value ?? "";
        }).join(",")
    );
    return [header, ...rows].join("\n");
}
import downloadIcon from "./assets/download.svg";

export default function DownloadCSVButton({ items }) {
    const handleDownload = () => {
        const csv = convertToCSV(items);
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Format: YYYYMMDD_HHmmss_needs_ordered_list.csv
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const datetime = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        a.download = `${datetime}_needs_ordered_list.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (
        <button
            onClick={handleDownload}
            style={{
                marginLeft: 12,
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                verticalAlign: 'middle',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(69, 59, 59, 0.48)',
                transition: 'background 0.2s',
            }}
            aria-label="Download CSV"
            title="Download CSV"
        >
            <img src={downloadIcon} alt="Download CSV" style={{ width: 32, height: 32 }} />
        </button>
    );
}
