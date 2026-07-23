import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./PortalLayout.css";

export function PortalLayout() {
  const { discordId, isAdmin, logout } = useAuth();

  return (
    <div className="portal-layout">
      <header className="portal-header">
        <div className="portal-header__brand">
          <img src="/SH-Site/emblem.png" alt="Герб" className="portal-header__emblem" />
          <div>
            <strong>Портал для лікарів</strong>
            <span>КНП «Слобідська ЦРЛ» СМР</span>
          </div>
        </div>

        <nav className="portal-nav">
          <NavLink
            to="/portal/dashboard"
            end
            className={({ isActive }) => `portal-nav__link${isActive ? " portal-nav__link--active" : ""}`}
          >
            Ієрархія посад
          </NavLink>
          <NavLink
            to="/portal/dashboard/reglament"
            className={({ isActive }) => `portal-nav__link${isActive ? " portal-nav__link--active" : ""}`}
          >
            Регламент
          </NavLink>
          {isAdmin && (
            <NavLink
              to="/portal/dashboard/admin"
              className={({ isActive }) => `portal-nav__link${isActive ? " portal-nav__link--active" : ""}`}
            >
              Управління
            </NavLink>
          )}
        </nav>

        <div className="portal-header__user">
          {discordId && <span className="portal-header__name">{discordId}</span>}
          <button className="portal-header__logout" onClick={logout}>
            Вийти
          </button>
        </div>
      </header>

      <main className="portal-main">
        <Outlet />
      </main>
    </div>
  );
}