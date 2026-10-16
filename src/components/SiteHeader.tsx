import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "./AppLink";
import { hrefFor } from "../utils/links";
import {
  fetchMe,
  fetchNotifications,
  getToken,
  markNotificationsRead,
  type NotificationItem,
} from "../api";
import {
  APPOINTMENT_REVIEW_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  REVIEWER_ROLES_UI,
  hasAnyRole,
} from "../data/roles";
import "./SiteHeader.css";

const NAV_LINKS = [
  { to: "/", label: "Головна" },
  { to: "/pro-likarniu", label: "Про лікарню" },
  { to: "/viddilennya", label: "Відділення" },
  { to: "/spivrobitnyky", label: "Працівники" },
  { to: "/dlya-pacientiv", label: "Для пацієнтів" },
  { to: "/zayavky", label: "Заявки" },
  { to: "/kontakty", label: "Контакти" },
];

const SEARCH_INDEX = [
  ...NAV_LINKS.map((l) => ({ title: l.label, to: l.to })),
  { title: "Структура лікарні", to: "/viddilennya" },
  { title: "Керівництво", to: "/spivrobitnyky" },
  { title: "Подати заявку", to: "/zayavky" },
  { title: "Особистий кабінет", to: "/kabinet" },
  { title: "Звернення пацієнта", to: "/zayavky" },
  { title: "Вакансії та працевлаштування", to: "/zayavky" },
  { title: "Контакти та адреса", to: "/kontakty" },
];

function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!getToken()) return;
    setItems(await fetchNotifications());
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!getToken()) return null;

  const onOpen = () => {
    const next = !open;
    setOpen(next);
    if (next && items.some((n) => !n.read)) {
      const ids = items.filter((n) => !n.read).map((n) => n.id);
      void markNotificationsRead(ids);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="site-header__bell" ref={ref}>
      <button type="button" onClick={onOpen} aria-label="Сповіщення" className="site-header__bell-btn">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1.8a3.6 3.6 0 0 0-3.6 3.6c0 3-1.4 4.2-1.4 4.2h10s-1.4-1.2-1.4-4.2A3.6 3.6 0 0 0 8 1.8Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M6.6 12.4a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="site-header__bell-count">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="site-header__bell-panel">
          <div className="site-header__bell-head">Сповіщення</div>
          {items.length === 0 ? (
            <p className="site-header__bell-empty">Поки що немає сповіщень.</p>
          ) : (
            <ul>
              {items.slice(0, 15).map((n) => (
                <li key={n.id} className={n.read ? "" : "site-header__bell-item--unread"}>
                  <strong>{n.title}</strong>
                  {n.body && <p>{n.body}</p>}
                  <span>{new Date(n.createdAt + "Z").toLocaleString("uk-UA")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [canPanel, setCanPanel] = useState(() => !!getToken());
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getToken()) return;
    void (async () => {
      const me = await fetchMe();
      if (!me) {
        setCanPanel(false);
        return;
      }
      setCanPanel(
        hasAnyRole(me.roles, REVIEWER_ROLES_UI) ||
          hasAnyRole(me.roles, ASSIGNER_ROLES_UI) ||
          hasAnyRole(me.roles, MANAGE_ANN_ROLES_UI) ||
          hasAnyRole(me.roles, APPOINTMENT_REVIEW_ROLES_UI),
      );
    })();
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results[0]) {
      window.location.href = hrefFor(results[0].to);
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <header className="site-header">
      <div className="container site-header__brand-row">
        <Link to="/" className="site-header__brand">
          <img src={`${import.meta.env.BASE_URL}img/emblem.png`} alt="" className="site-header__logo" />
          <span className="site-header__brand-text">
            <strong>КНП "Слобідська центральна районна лікарня"</strong>
            <span>Слобідської міської ради · Офіційний веб-портал</span>
          </span>
        </Link>

        <div className="site-header__tools" ref={boxRef}>
          <form className="site-header__search" onSubmit={submit} role="search">
            <input
              type="search"
              placeholder="Пошук по сайту..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              aria-label="Пошук по сайту"
            />
            <button type="submit" aria-label="Знайти">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {open && results.length > 0 && (
              <ul className="site-header__results">
                {results.map((item) => (
                  <li key={item.to + item.title}>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = hrefFor(item.to);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>

          <NotificationBell />

          {canPanel && (
            <Link to="/panel" className="site-header__login">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="2.5" y="3" width="11" height="8.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6 14h4M8 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span className="site-header__login-text">Панель працівника</span>
            </Link>
          )}

          <Link to="/kabinet" className="site-header__login">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.3" />
              <path d="M2.8 13.5c.6-2.6 2.6-4 5.2-4s4.6 1.4 5.2 4" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <span className="site-header__login-text">Особистий кабінет</span>
          </Link>
        </div>
      </div>

      <nav className="site-header__tabs" aria-label="Основна навігація">
        <div className="container site-header__tabs-inner">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) => `site-header__tab${isActive ? " site-header__tab--active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
