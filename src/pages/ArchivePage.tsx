import { useCallback, useEffect, useState } from "react";
import {
  adminArchiveClear,
  createArchiveCode,
  deleteAnnouncement,
  fetchArchive,
  fetchMe,
  getToken,
  loginUrl,
  redeemArchiveCode,
  toggleAnnouncementLike,
  type PublicAnnouncement,
} from "../api";
import { AnnouncementCard } from "../components/Announcements";
import { PortalLayout } from "../components/PortalLayout";
import { STAFF_ROLES_UI } from "../data/roles";
import "./AnnouncementsPage.css";

export function ArchivePage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [staff, setStaff] = useState(false);
  const [items, setItems] = useState<PublicAnnouncement[]>([]);
  const [code, setCode] = useState("");
  const [redeemed, setRedeemed] = useState<PublicAnnouncement | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [codeFor, setCodeFor] = useState<string | null>(null);
  const [isSysadmin, setIsSysadmin] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  const load = useCallback(async () => {
    const hasToken = !!getToken();
    setAuthed(hasToken);
    if (!hasToken) {
      setLoading(false);
      return;
    }
    const me = await fetchMe();
    const isStaff = !!me && me.roles.some((r) => STAFF_ROLES_UI.includes(r));
    setIsSysadmin(!!me && me.roles.includes("sysadmin"));
    setStaff(isStaff);
    if (isStaff) setItems(await fetchArchive());
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
    }
  };

  const onRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await redeemArchiveCode(code.trim());
    if (!res.ok) {
      setMsg(res.error);
      setRedeemed(null);
      return;
    }
    setRedeemed(res.announcement);
    setCode("");
  };

  const onMakeCode = async (id: string) => {
    setMsg(null);
    const res = await createArchiveCode(id);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setCodeFor(res.code);
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Видалити це оголошення назавжди?")) return;
    setMsg(null);
    const res = await deleteAnnouncement(id);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  const onClearAll = async () => {
    if (!window.confirm("Видалити ВСІ архівні оголошення? Це незворотно.")) return;
    setClearBusy(true);
    const res = await adminArchiveClear();
    setClearBusy(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg(null);
    setItems([]);
    window.alert(`Видалено: ${res.deleted}`);
  };

  return (
    <PortalLayout title="Архів оголошень">
      {!authed ? (
        <div className="p-block ann-login-gate">
          <div className="p-block__head">Архів недоступний</div>
          <div className="p-block__body">
            <p>Архів оголошень доступний лише після входу в кабінет.</p>
            <a href={loginUrl()} className="portal-cta">
              Увійти через Google
            </a>
          </div>
        </div>
      ) : loading ? (
        <div className="p-block">
          <div className="p-block__body">Завантаження...</div>
        </div>
      ) : staff ? (
        <>
          <p className="p-lead">
            Оголошення віком понад 60 днів. Зображення приховано для публікацій
            старших за 90 днів.
          </p>
          {codeFor && (
            <div className="p-block ann-code-created">
              <div className="p-block__head p-block__head--teal">
                Код доступу (діє 10 хвилин)
              </div>
              <div className="p-block__body">
                <code className="ann-code-value">{codeFor}</code>
                <button
                  type="button"
                  className="cabinet-logout"
                  onClick={() => void navigator.clipboard.writeText(codeFor)}
                >
                  Копіювати
                </button>
              </div>
            </div>
          )}
          {msg && <p className="cabinet-profile-error">{msg}</p>}
          {isSysadmin && (
            <div style={{ marginBottom: "1rem" }}>
              <button
                type="button"
                className="cabinet-logout"
                onClick={() => void onClearAll()}
                disabled={clearBusy}
              >
                {clearBusy ? "..." : "Очистити весь архів"}
              </button>
            </div>
          )}
          {items.length === 0 ? (
            <p className="ann-empty">Поки що пусто</p>
          ) : (
            <ul className="ann-list">
              {items.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  item={a}
                  onLike={onLike}
                  full
                  extra={
                    <>
                      <button
                        type="button"
                        className="cabinet-logout"
                        onClick={() => void onMakeCode(a.id)}
                      >
                        Створити код для пацієнта
                      </button>
                      {isSysadmin && (
                        <button
                          type="button"
                          className="cabinet-logout"
                          onClick={() => void onDelete(a.id)}
                        >
                          Видалити
                        </button>
                      )}
                    </>
                  }
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="p-lead">
            Пацієнт бачить архівне оголошення лише за одноразовим 10-хвилинним
            кодом від працівника лікарні.
          </p>
          <div className="p-block">
            <div className="p-block__head p-block__head--teal">Ввести код</div>
            <div className="p-block__body">
              <form onSubmit={onRedeem} className="ann-code-form">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Напр. 3F9A2C"
                  maxLength={6}
                  required
                />
                <button type="submit" className="portal-cta">
                  Відкрити
                </button>
              </form>
              {msg && <p className="cabinet-profile-error">{msg}</p>}
            </div>
          </div>
          {redeemed && (
            <ul className="ann-list" style={{ marginTop: "1rem" }}>
              <AnnouncementCard item={{ ...redeemed, category: "archive" }} full />
            </ul>
          )}
        </>
      )}
    </PortalLayout>
  );
}
