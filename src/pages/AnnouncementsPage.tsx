import { useCallback, useEffect, useState } from "react";
import {
  fetchAnnouncements,
  getToken,
  loginUrl,
  toggleAnnouncementLike,
  type PublicAnnouncement,
} from "../api";
import { AnnouncementCard } from "../components/Announcements";
import { Link } from "../components/AppLink";
import { PortalLayout } from "../components/PortalLayout";
import "./AnnouncementsPage.css";

export function AnnouncementsPage() {
  const [items, setItems] = useState<PublicAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const load = useCallback(async () => {
    const all = await fetchAnnouncements();
    const regular = all.filter(
      (a) => a.type === "regular" && a.category !== "archive",
    );
    setItems(regular);
    setAuthed(!!getToken());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onLike = async (id: string) => {
    const res = await toggleAnnouncementLike(id);
    if (res.ok) {
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, liked: res.liked, likes: res.likes } : a)),
      );
    } else if (res.status === 401) {
      window.location.href = loginUrl();
    }
  };

  const matchQuery = (a: PublicAnnouncement) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.title ?? "").toLowerCase().includes(q) ||
      a.summary?.toLowerCase().includes(q) === true ||
      a.text.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
    );
  };
  const matchTag = (a: PublicAnnouncement) => !tag || a.tags.includes(tag);

  const allTags = [...new Set(items.flatMap((a) => a.tags))].slice(0, 24);
  const active = items.filter((a) => a.category === "active" && matchQuery(a) && matchTag(a));
  const old = items.filter((a) => a.category === "old" && matchQuery(a) && matchTag(a));
  const filtering = query.trim().length > 0 || tag !== null;

  return (
    <PortalLayout title="Оголошення">
      {!authed ? (
        <div className="p-block ann-login-gate">
          <div className="p-block__head">Доступ до оголошень</div>
          <div className="p-block__body">
            <p>Перегляд усіх оголошень доступний після входу в кабінет.</p>
            <a href={loginUrl()} className="portal-cta">
              Увійти через Google
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="ann-search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук за заголовком, текстом або тегом..."
              aria-label="Пошук оголошень"
            />
            {allTags.length > 0 && (
              <div className="ann-search__tags">
                {allTags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`ann-tag ann-tag--btn${tag === t ? " ann-tag--on" : ""}`}
                    onClick={() => setTag((prev) => (prev === t ? null : t))}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            {filtering && (
              <button
                type="button"
                className="ann-search__reset"
                onClick={() => {
                  setQuery("");
                  setTag(null);
                }}
              >
                Скинути фільтри
              </button>
            )}
          </div>

          <div className="ann-feed-section">
            <div className="ann-feed-section__head">Активні оголошення</div>
            {loading ? (
              <p className="ann-empty">Завантаження...</p>
            ) : active.length === 0 ? (
              <p className="ann-empty">
                {filtering ? "Нічого не знайдено" : "Поки що пусто"}
              </p>
            ) : (
              <ul className="ann-list">
                {active.map((a) => (
                  <AnnouncementCard key={a.id} item={a} onLike={onLike} />
                ))}
              </ul>
            )}
          </div>

          {old.length > 0 && (
            <div className="ann-feed-section">
              <div className="ann-feed-section__head">Старі оголошення</div>
              <ul className="ann-list">
                {old.map((a) => (
                  <AnnouncementCard key={a.id} item={a} onLike={onLike} />
                ))}
              </ul>
            </div>
          )}

          <div className="ann-feed-foot">
            <Link to="/arhiv" className="portal-cta">
              Архів оголошень
            </Link>
          </div>
        </>
      )}
    </PortalLayout>
  );
}
