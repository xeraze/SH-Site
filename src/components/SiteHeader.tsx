import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { Link, NavLink } from "./AppLink";
import { hrefFor } from "../utils/links";
import {
  clearNotifications,
  fetchAnnouncements,
  fetchMe,
  fetchNotifications,
  getToken,
  markNotificationsRead,
  type NotificationItem,
  type PublicAnnouncement,
} from "../api";
import {
  APPOINTMENT_REVIEW_ROLES_UI,
  ASSIGNER_ROLES_UI,
  MANAGE_ANN_ROLES_UI,
  REVIEWER_ROLES_UI,
  hasAnyRole,
} from "../data/roles";
import { departments, separateUnits } from "../data/hierarchy";
import { staffMembers } from "../data/staff";
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

interface SearchEntry {
  title: string;
  to: string;
  kind: "page" | "dept" | "staff" | "ann";
  keywords: string;
}

const PAGE_INDEX: SearchEntry[] = [
  { title: "Головна", to: "/", kind: "page", keywords: "головна старт головна сторінка" },
  { title: "Про лікарню", to: "/pro-likarniu", kind: "page", keywords: "про лікарню історія про заклад" },
  { title: "Відділення", to: "/viddilennya", kind: "page", keywords: "відділення структура структура лікарні підрозділи" },
  { title: "Працівники", to: "/spivrobitnyky", kind: "page", keywords: "працівники персонал лікарі керівництво колектив" },
  { title: "Для пацієнтів", to: "/dlya-pacientiv", kind: "page", keywords: "для пацієнтів інформація пацієнтам правила" },
  { title: "Заявки", to: "/zayavky", kind: "page", keywords: "заявки звернення подати заявку вакансії працевлаштування скарга" },
  { title: "Контакти", to: "/kontakty", kind: "page", keywords: "контакти адреса телефон графік роботи як дістатися" },
  { title: "Особистий кабінет", to: "/kabinet", kind: "page", keywords: "кабінет особистий вхід реєстрація профіль" },
  { title: "Оголошення", to: "/oholoshennya", kind: "page", keywords: "оголошення новини події" },
  { title: "Запис на прийом", to: "/zapys-na-pryiom", kind: "page", keywords: "запис прийом записатися лікар консультація" },
  { title: "Архів оголошень", to: "/arhiv", kind: "page", keywords: "архів старі оголошення" },
  { title: "Порядок назви допомоги", to: "/kontakty", kind: "page", keywords: "порядок назви допомоги смерті свідоцтво" },
];

function buildStaticIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [...PAGE_INDEX];
  for (const d of [...departments, ...separateUnits]) {
    entries.push({
      title: d.name,
      to: `/viddilennya/${d.id}`,
      kind: "dept",
      keywords: `${d.name} ${d.description}`,
    });
  }
  for (const s of staffMembers) {
    entries.push({
      title: s.fullName,
      to: `/spivrobitnyky`,
      kind: "staff",
      keywords: `${s.fullName} ${s.positions.join(" ")} ${s.departments.join(" ")}`,
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
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!getToken()) return;
    setItems(await fetchNotifications());
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
  const [canPanel, setCanPanel] = useState(() => !!getToken());
  const [anns, setAnns] = useState<PublicAnnouncement[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadAnnouncementsOnce().then(setAnns);
  }, []);

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

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 8).map((s) => s.entry);
  }, [query, anns]);

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

          {canPanel && (
            <Link to="/panel" className="site-header__login">
              <Icon icon="mdi:monitor-dashboard" width={15} height={15} />
              <span className="site-header__login-text">Панель працівника</span>
            </Link>
          )}

          <Link to="/kabinet" className="site-header__login">
            <Icon icon="mdi:account-circle-outline" width={15} height={15} />
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
