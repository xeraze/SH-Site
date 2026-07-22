import { NavLink, Outlet } from "react-router-dom";
import { Emblem } from "../components/Emblem";
import { useAuth } from "./AuthContext";
import "./PortalLayout.css";

export function PortalLayout() {
  const { doctorName, logout } = useAuth();

  return (
    <div className="portal-layout">
      <header className="portal-header">
        <div className="portal-header__brand">
          <Emblem size={36} animated={false} />
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
        </nav>

        <div className="portal-header__user">
          {doctorName && <span className="portal-header__name">{doctorName}</span>}
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
