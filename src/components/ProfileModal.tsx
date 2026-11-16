import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { ROLE_LABELS_UI, ROLE_ICONS_UI, STAFF_STATUS_LABELS, isStaffStatus } from "../data/roles";
import { personalizationLabels } from "../data/personalization";
import { positionOf } from "../data/positions";
import { fetchMe, getToken, type PublicUser } from "../api";

export interface ProfileUser {
  id?: string;
  name: string;
  email?: string | null;
  age?: number | null;
  registeredAt?: string | null;
  bio?: string | null;
  specialization?: string | null;
  personalization?: string[];
  avatar?: string | null;
  roles?: string[];
  staffStatus?: string | null;
  discordUsername?: string | null;
  robloxUsername?: string | null;
}

let viewerCache: Promise<PublicUser | null> | null = null;

function loadViewer(): Promise<PublicUser | null> {
  if (!getToken()) return Promise.resolve(null);
  if (!viewerCache) {
    viewerCache = fetchMe().then((me) => {
      if (!me) viewerCache = null;
      return me;
    });
  }
  return viewerCache;
}

export function ProfileModal({
  user,
  onClose,
  variant = "admin",
}: {
  user: ProfileUser;
  onClose: () => void;
  variant?: "admin" | "public";
}) {
  const [zoomed, setZoomed] = useState(false);
  const isPublic = variant === "public";
  const [viewer, setViewer] = useState<PublicUser | null | undefined>(undefined);
  const roles = (user.roles ?? []).filter((r) => r !== "sysadmin");
  const positions = roles.filter((r) => r !== "patient" && r !== "employee");
  const badges = roles.filter((r) => r !== "patient" && r !== "employee");
  const personalization = personalizationLabels(user.personalization ?? []);
  const roleItems = personalization.filter((p) => !p.id.startsWith("dept_"));
  const deptItems = personalization.filter((p) => p.id.startsWith("dept_"));
  const empty = "Порожньо";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void loadViewer().then((me) => {
      if (alive) setViewer(me);
    });
    return () => {
      alive = false;
    };
  }, []);

  const deputyRank = positionOf("deputy_director")?.rank ?? 60;
  const viewerRank = viewer
    ? Math.max(0, ...viewer.roles.map((r) => positionOf(r)?.rank ?? 0))
    : 0;
  const isSelf = Boolean(viewer && user.id && viewer.id === user.id);
  const canSeeAccounts = Boolean(
    viewer && (isSelf || viewer.roles.includes("operator") || viewerRank >= deputyRank),
  );

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal__head">
          <strong>Профіль</strong>
          <button type="button" className="profile-modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="profile-modal__body">
          <div className="profile-modal__header">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="profile-modal__avatar"
                onClick={() => setZoomed(true)}
                onContextMenu={(e) => e.preventDefault()}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                }}
                draggable={false}
                style={{ cursor: "zoom-in" }}
              />
            ) : (
              <div className="profile-modal__avatar profile-modal__avatar--empty">
                <Icon icon="mdi:account" width={32} height={32} />
              </div>
            )}
            <div className="profile-modal__ident">
              <p className="profile-modal__name">{user.name}</p>
              {(badges.length > 0 || isStaffStatus(user.staffStatus)) && (
                <div className="profile-modal__tags">
                  {badges.map((r) => (
                    <span key={r} className="cabinet-role-icon" title={ROLE_LABELS_UI[r] ?? r}>
                      <Icon icon={ROLE_ICONS_UI[r] ?? "mdi:account"} width={16} height={16} />
                    </span>
                  ))}
                  {isStaffStatus(user.staffStatus) && (
                    <span className={`staff-status staff-status--${user.staffStatus}`}>
                      {STAFF_STATUS_LABELS[user.staffStatus]}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {(positions.length > 0 || personalization.length > 0) && (
            <section className="profile-modal__section">
              <div className="profile-modal__section-title">
                <Icon icon="mdi:briefcase-outline" width={14} height={14} />
                Робота в лікарні
              </div>
              {positions.length > 0 && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Спеціалізація</span>
                  <span className="profile-modal__row-value">
                    {user.specialization?.trim() || "Не вказано"}
                  </span>
                </div>
              )}
              {roleItems.length > 0 && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Ролі</span>
                  <span className="profile-modal__row-value">
                    {roleItems.map((p) => p.label).join(", ")}
                  </span>
                </div>
              )}
              {deptItems.length > 0 && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Відділення</span>
                  <span className="profile-modal__row-value">
                    {deptItems.map((p) => p.label).join(", ")}
                  </span>
                </div>
              )}
            </section>
          )}

          {!isPublic && (
            <section className="profile-modal__section">
              <div className="profile-modal__section-title">
                <Icon icon="mdi:card-account-details-outline" width={14} height={14} />
                Дані акаунта
              </div>
              <div className="profile-modal__row">
                <span className="profile-modal__row-label">Вік</span>
                <span className="profile-modal__row-value">{user.age ?? empty}</span>
              </div>
              {user.registeredAt && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Дата реєстрації</span>
                  <span className="profile-modal__row-value">
                    {new Date(user.registeredAt + "Z").toLocaleDateString("uk-UA")}
                  </span>
                </div>
              )}
              {canSeeAccounts && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Roblox</span>
                  <span className="profile-modal__row-value">{user.robloxUsername ?? empty}</span>
                </div>
              )}
              {canSeeAccounts && (
                <div className="profile-modal__row">
                  <span className="profile-modal__row-label">Discord</span>
                  <span className="profile-modal__row-value">{user.discordUsername ?? empty}</span>
                </div>
              )}
            </section>
          )}

          <section className="profile-modal__section">
            <div className="profile-modal__section-title">
              <Icon icon="mdi:text" width={14} height={14} />
              Про себе
            </div>
            {isPublic && (
              <div className="profile-modal__row">
                <span className="profile-modal__row-label">Вік</span>
                <span className="profile-modal__row-value">{user.age ?? empty}</span>
              </div>
            )}
            <p className="profile-modal__bio">{user.bio?.trim() || empty}</p>
          </section>
        </div>
      </div>
      {zoomed && user.avatar && (
        <div className="profile-zoom-overlay" onClick={(e) => { e.stopPropagation(); setZoomed(false); }}>
          <img
            src={user.avatar}
            alt=""
            className="profile-zoom-img"
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = "none";
            }}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
