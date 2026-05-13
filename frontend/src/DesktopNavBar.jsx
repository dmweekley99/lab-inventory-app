import { Link, useLocation } from "react-router-dom";

export default function DesktopNavBar() {
    const location = useLocation();
    // Only show on desktop (hidden on mobile via CSS)
    return (
        <nav className="desktop-nav-bar" style={{
            display: "flex",
            gap: "2rem",
            alignItems: "center",
            justifyContent: "center",
            margin: "2.5rem auto 1.5rem auto",
            fontSize: "1.1rem",
        }}>
            <Link className="top-nav-btn" to="/catalog" aria-current={location.pathname === "/catalog" ? "page" : undefined} tabIndex={location.pathname === "/catalog" ? -1 : 0} style={{ pointerEvents: location.pathname === "/catalog" ? "none" : "auto", background: location.pathname === "/catalog" ? "#aaa" : "#ffbe57", color: "#222", cursor: location.pathname === "/catalog" ? "default" : "pointer" }}>Inventory Catalog</Link>
            <Link className="top-nav-btn" to="/needs-ordered" aria-current={location.pathname === "/needs-ordered" ? "page" : undefined} tabIndex={location.pathname === "/needs-ordered" ? -1 : 0} style={{ pointerEvents: location.pathname === "/needs-ordered" ? "none" : "auto", background: location.pathname === "/needs-ordered" ? "#aaa" : "#ffbe57", color: "#222", cursor: location.pathname === "/needs-ordered" ? "default" : "pointer" }}>Needs Ordered</Link>
            <Link className="top-nav-btn" to="/pending-orders" aria-current={location.pathname === "/pending-orders" ? "page" : undefined} tabIndex={location.pathname === "/pending-orders" ? -1 : 0} style={{ pointerEvents: location.pathname === "/pending-orders" ? "none" : "auto", background: location.pathname === "/pending-orders" ? "#aaa" : "#ffbe57", color: "#222", cursor: location.pathname === "/pending-orders" ? "default" : "pointer" }}>Pending Orders</Link>
        </nav>
    );
}
