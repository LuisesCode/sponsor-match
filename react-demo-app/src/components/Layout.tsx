import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <nav className="layout__nav">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                isActive ? "layout__link layout__link--active" : "layout__link"
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="layout__content">
        <Outlet />
      </main>

      <footer className="layout__footer">
        <p>&copy; {new Date().getFullYear()} React Demo App</p>
      </footer>
    </div>
  );
}

export default Layout;
