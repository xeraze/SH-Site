import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import "./NavBar.css";

const NAV_LINKS = [
  { to: "/", label: "Головна" },
  { to: "/pro-likarniu", label: "Про лікарню" },
  { to: "/viddilennya", label: "Відділення" },
  { to: "/spivrobitnyky", label: "Співробітники" },
  { to: "/dlya-pacientiv", label: "Для пацієнтів" },
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
      </div>
    </header>
  );
}