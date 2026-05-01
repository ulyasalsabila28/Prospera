import { Link, useLocation } from "react-router-dom";

export default function Dashboard({ children }) {
  const loc = useLocation();

  const menu = [
    { path: "/products", label: "Products", icon: "bi-box" },
    { path: "/transaction", label: "Transactions", icon: "bi-archive-fill" }
  ];

  return (
    <>
      <div className="sidebar">
        <h2 className="logo">
          <i className="bi bi-stack"></i>
          Prospera BI
        </h2>

        {menu.map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className={`nav-link ${loc.pathname === m.path ? "active" : ""}`}
          >
            <div className="menu-item">
              <i className={`bi ${m.icon}`}></i>
              <span>{m.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="main-content">
        {children}
      </div>
    </>
  );
}