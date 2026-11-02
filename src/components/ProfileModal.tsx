import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { ROLE_LABELS_UI, ROLE_ICONS_UI } from "../data/roles";

export interface ProfileUser {
  id?: string;
  name: string;
  email?: string | null;
  age?: number | null;
  registeredAt?: string | null;
  bio?: string | null;
  avatar?: string | null;
  roles?: string[];
  discordUsername?: string | null;
  robloxUsername?: string | null;
}

export function ProfileModal({
  user,
  onClose,
}: {
  user: ProfileUser;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const roles = (user.roles ?? []).filter((r) => r !== "sysadmin");
  const empty = "Порожньо";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
            <div>
              <p className="profile-modal__name">{user.name}</p>
              {roles.length > 0 && (
                <span className="cabinet-role-badges">
                  {roles.map((r) => (
                    <span key={r} className="cabinet-role-icon" title={ROLE_LABELS_UI[r] ?? r}>
                      <Icon icon={ROLE_ICONS_UI[r] ?? "mdi:account"} width={16} height={16} />
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
          <p><strong>Email:</strong> {user.email ?? empty}</p>
          <p><strong>Вік:</strong> {user.age ?? empty}</p>
          <p><strong>Roblox Username:</strong> {user.robloxUsername ?? empty}</p>
          <p><strong>Discord Username:</strong> {user.discordUsername ?? empty}</p>
          {user.registeredAt && (
            <p>
              <strong>Реєстрація:</strong>{" "}
              {new Date(user.registeredAt + "Z").toLocaleDateString("uk-UA")}
            </p>
          )}
          <p><strong>Про себе:</strong> {user.bio?.trim() || empty}</p>
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
