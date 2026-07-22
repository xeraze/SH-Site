import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

const NAV_LINKS = [
  { to: "/", label: "Головна" },
  { to: "/pro-likarniu", label: "Про лікарню" },
  { to: "/spivrobitnyky", label: "Персонал" },
  { to: "/kontakty", label: "Контакти" },
];

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`navbar${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <img src="/SH-Site/emblem.png" alt="Герб" className="navbar__emblem" />
          <span className="navbar__brand-text">
            <strong>Слобідська ЦРЛ</strong>
            <span>Довідковий центр</span>
          </span>
        </Link>

        <nav className="navbar__links" aria-label="Основна навігація">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `navbar__link${isActive ? " navbar__link--active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/portal" className="navbar__portal-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Портал для лікарів
        </Link>
      </div>
    </header>
  );
}
