import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink } from "./AppLink";
import { hrefFor } from "../utils/links";
import {
  clearNotifications,
  fetchAnnouncements,
  fetchDepartmentStaffOnce,
  fetchMeResult,
  fetchNotifications,
  getToken,
  markNotificationsRead,
  type DepartmentStaffItem,
  type NotificationItem,
  type PublicAnnouncement,
} from "../api";
import { isSoundMuted, playNotificationSound, setSoundMuted } from "../sound";
import {
  APPOINTMENT_REVIEW_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  REVIEWER_ROLES_UI,
  ROLE_LABELS_UI,
  hasAnyRole,
} from "../data/status";
import { personalizationLabels } from "../data/departments";
import { departments } from "../data/hierarchy";
import "./Head.css";

const NAV_LINKS = [
  { to: "/", label: "Головна" },
  { to: "/about-hospital", label: "Про лікарню" },
  { to: "/departments", label: "Відділення" },
  { to: "/documentation", label: "Документація" },
  { to: "/for-patients", label: "Для пацієнтів" },
  { to: "/forms", label: "Анкети" },
  { to: "/reviews", label: "Відгуки" },
  { to: "/links", label: "Інше" },
];

interface SearchEntry {
  title: string;
  to: string;
  kind: "page" | "dept" | "staff" | "ann";
  keywords: string;
}

const PAGE_INDEX: SearchEntry[] = [
  { title: "Головна", to: "/", kind: "page", keywords: "головна старт головна сторінка" },
  { title: "Про лікарню", to: "/about-hospital", kind: "page", keywords: "про лікарню історія про заклад" },
  { title: "Відділення", to: "/departments", kind: "page", keywords: "відділення структура структура лікарні підрозділи" },
  { title: "Документація", to: "/documentation", kind: "page", keywords: "документація документи нормативні положення інструкції правила" },
  { title: "Для пацієнтів", to: "/for-patients", kind: "page", keywords: "для пацієнтів інформація пацієнтам правила" },
  { title: "Анкети", to: "/forms", kind: "page", keywords: "анкети звернення подати анкету вакансії працевлаштування скарга" },
  { title: "Відгуки", to: "/reviews", kind: "page", keywords: "відгуки відгук оцінка лікар відгук про лікаря" },
  { title: "Інше", to: "/links", kind: "page", keywords: "інше контакти адреса телефон графік роботи як дістатися" },
  { title: "Особистий кабінет", to: "/kabinet", kind: "page", keywords: "кабінет особистий вхід реєстрація профіль" },
  { title: "Оголошення", to: "/oholoshennya", kind: "page", keywords: "оголошення новини події" },
  { title: "Запис на прийом", to: "/forms?type=appointment", kind: "page", keywords: "запис прийом записатися лікар консультація" },
  { title: "Архів оголошень", to: "/arhiv", kind: "page", keywords: "архів старі оголошення" },
  { title: "Порядок назви допомоги", to: "/links", kind: "page", keywords: "порядок назви допомоги смерті свідоцтво" },
];

function buildStaticIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [...PAGE_INDEX];
  for (const d of departments) {
    entries.push({
      title: d.name,
      to: `/departments/${d.id}`,
      kind: "dept",
      keywords: `${d.name} ${d.description}`,
    });
  }
  return entries;
}

const STATIC_INDEX = buildStaticIndex();

let annCache: PublicAnnouncement[] | null = null;
let annLoading: Promise<PublicAnnouncement[]> | null = null;

function loadAnnouncementsOnce(): Promise<PublicAnnouncement[]> {
  if (annCache) return Promise.resolve(annCache);
  if (!annLoading) {
    annLoading = fetchAnnouncements()
      .then((items) => {
        annCache = items;
        return items;
      })
      .catch(() => {
        annLoading = null;
        return [] as PublicAnnouncement[];
      });
  }
  return annLoading;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

function scoreEntry(entry: SearchEntry, qWords: string[]): number {
  const title = normalize(entry.title);
  const keywords = normalize(entry.keywords);
  let score = 0;
  for (const w of qWords) {
    if (title.includes(w)) score += 3;
    else if (keywords.includes(w)) score += 1;
    else return 0;
  }
  return score;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(isSoundMuted());
  const ref = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string> | null>(null);

  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!getToken()) return;
    const list = await fetchNotifications();
    if (!list) return;
    const prev = seenRef.current;
    if (prev) {
      const hasNew = list.some((n) => !n.read && !prev.has(n.id));
      if (hasNew) playNotificationSound();
    } else {
      seenRef.current = new Set();
    }
    seenRef.current = new Set(list.map((n) => n.id));
    setItems(list);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 5_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
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
        <Icon icon="mdi:bell-outline" width={17} height={17} />
        {unread > 0 && <span className="site-header__bell-count">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="site-header__bell-panel">
          <div className="site-header__bell-head">
            <span>Сповіщення</span>
            <div className="site-header__bell-actions">
              <button
                type="button"
                className="site-header__bell-clear"
                aria-label={muted ? "Увімкнути звук сповіщень" : "Вимкнути звук сповіщень"}
                title={muted ? "Увімкнути звук сповіщень" : "Вимкнути звук сповіщень"}
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  setSoundMuted(next);
                  if (!next) playNotificationSound();
                }}
              >
                <Icon icon={muted ? "mdi:volume-off" : "mdi:volume-high"} width={16} height={16} />
              </button>
              {items.length > 0 && (
                <button
                  type="button"
                  className="site-header__bell-clear"
                  aria-label="Очистити сповіщення"
                  title="Очистити сповіщення"
                  onClick={() => {
                    void clearNotifications().then(() => setItems([]));
                  }}
                >
                  <Icon icon="mdi:delete-outline" width={16} height={16} />
                </button>
              )}
            </div>
          </div>
          {items.length === 0 ? (
            <p className="site-header__bell-empty">Поки що немає сповіщень.</p>
          ) : (
            <ul>
              {items.slice(0, 15).map((n) => (
                <li key={n.id} className={n.read ? "" : "site-header__bell-item--unread"}>
                  <strong>{n.title}</strong>
                  {n.body && <p>{n.body}</p>}
                  <div className="site-header__bell-row">
                    <span>{new Date(n.createdAt + "Z").toLocaleString("uk-UA")}</span>
                    {n.link && (
                      <button
                        type="button"
                        className="site-header__bell-link"
                        onClick={() => {
                          setOpen(false);
                          window.location.href = hrefFor(n.link!);
                        }}
                      >
                        Перейти →
                      </button>
                    )}
                  </div>
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
  const [canPanel, setCanPanel] = useState(false);
  const [anns, setAnns] = useState<PublicAnnouncement[]>([]);
  const [staff, setStaff] = useState<DepartmentStaffItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadAnnouncementsOnce().then(setAnns);
    void fetchDepartmentStaffOnce().then(setStaff);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    let attempt = 0;
    const run = async () => {
      const res = await fetchMeResult();
      if (cancelled) return;
      if (!res.ok) {
        attempt += 1;
        if (attempt < 4) window.setTimeout(() => void run(), 2000 * attempt);
        return;
      }
      const me = res.user;
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
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const qWords = q.split(/\s+/).filter(Boolean);
    if (qWords.length === 0) return [];

    const scored: { entry: SearchEntry; score: number }[] = [];
    for (const entry of STATIC_INDEX) {
      const score = scoreEntry(entry, qWords);
      if (score > 0) scored.push({ entry, score });
    }
    for (const a of anns) {
      const title = a.title ?? stripHtml(a.text).slice(0, 80);
      const body = `${title} ${a.summary ?? ""} ${stripHtml(a.text).slice(0, 400)} ${a.tags.join(" ")}`;
      const entry: SearchEntry = {
        title,
        to: `/oholoshennya/${a.id}`,
        kind: "ann",
        keywords: body,
      };
      const score = scoreEntry(entry, qWords);
      if (score > 0) scored.push({ entry, score });
    }

    for (const s of staff) {
      const positions = s.roles
        .filter((r) => r !== "patient" && r !== "employee" && r !== "sysadmin")
        .map((r) => ROLE_LABELS_UI[r] ?? r)
        .join(" ");
      const depts = personalizationLabels(s.personalization)
        .map((p) => p.label)
        .join(" ");
      const home = departments.find((d) => s.personalization.includes(d.id));
      const entry: SearchEntry = {
        title: s.name,
        to: home ? `/departments/${home.id}` : `/departments`,
        kind: "staff",
        keywords: `${s.name} ${positions} ${s.specialization ?? ""} ${depts}`,
      };
      const score = scoreEntry(entry, qWords);
      if (score > 0) scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.entry);
  }, [query, anns, staff]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boxRef.current && !boxRef.current.contains(target)) setOpen(false);
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
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
            <strong>Офіційний веб-портал</strong>
            <span>Слобідської лікарні · Слобідської міської ради</span>
          </span>
        </Link>

        <div className="site-header__tools" ref={boxRef}>
          <form className="site-header__search" onSubmit={submit} role="search">
            <input
              type="search"
              placeholder="Пошук..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              aria-label="Пошук по сайту"
            />
            <button type="submit" aria-label="Знайти">
              <Icon icon="mdi:magnify" width={15} height={15} />
            </button>
            {open && results.length > 0 && (
              <ul className="site-header__results">
                {results.map((item) => (
                  <li key={item.kind + item.to + item.title}>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = hrefFor(item.to);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      <span className="site-header__result-kind">
                        {item.kind === "page"
                          ? "Сторінка"
                          : item.kind === "dept"
                            ? "Відділення"
                            : item.kind === "staff"
                              ? "Працівник"
                              : "Оголошення"}
                      </span>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {open && query.trim() && results.length === 0 && (
              <div className="site-header__results site-header__results--empty">
                Нічого не знайдено
              </div>
            )}
          </form>

          <NotificationBell />

          <div
            className="site-header__menu"
            ref={menuRef}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setMenuOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setMenuOpen(false);
                menuRef.current?.querySelector("button")?.focus();
              }
            }}
          >
            <button
              type="button"
              className="site-header__menu-btn"
              aria-label="Меню акаунта"
              aria-expanded={menuOpen}
              aria-controls="site-header-account-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon icon="mdi:menu" width={18} height={18} />
            </button>
            {menuOpen && (
              <nav id="site-header-account-menu" className="site-header__menu-panel" aria-label="Меню акаунта">
                {canPanel && (
                  <Link
                    to="/panel"
                    className="site-header__login site-header__menu-link"
                  >
                    <Icon icon="mdi:monitor-dashboard" width={15} height={15} />
                    <span>Панель працівника</span>
                  </Link>
                )}
                <Link
                  to="/kabinet"
                  className="site-header__login site-header__menu-link"
                >
                  <Icon icon="mdi:account-circle-outline" width={15} height={15} />
                  <span>Особистий кабінет</span>
                </Link>
              </nav>
            )}
          </div>
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
