import { useEffect, useState } from "react";
import { roleHierarchy, type Role, type RoleStatus } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import "./HierarchyPage.css";

const STATUS_LABEL: Record<RoleStatus, string> = {
  vacant: "Вільна",
  occupied: "Зайнята",
  limited: "Є місця",
};

function StatusBadge({ role }: { role: Role }) {
  const label =
    role.status === "limited" && role.limit
      ? `${role.occupied ?? 0} / ${role.limit}`
      : STATUS_LABEL[role.status];

  return (
    <span className={`status-badge status-badge--${role.status}`}>
      <span className="status-badge__dot" />
      {label}
    </span>
  );
}

const WORKER_URL = import.meta.env.VITE_AUTH_WORKER_URL ?? "https://sh-site.xeraze-official.workers.dev";

export function HierarchyPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [filter, setFilter] = useState<RoleStatus | "all">("all");
  const [liveStatuses, setLiveStatuses] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch(`${WORKER_URL}/statuses`)
      .then(res => res.json())
      .then(data => {
        if (data.statuses) setLiveStatuses(data.statuses);
      })
      .catch(err => console.error("Failed to load statuses", err));
  }, []);

  // Підміняємо статичні статуси на живі
  const getRoleData = (role: Role): Role => {
    const live = liveStatuses[role.id];
    if (!live) return role;
    return { ...role, ...live };
  };

  return (
    <div className="hierarchy-page">
      <div className="hierarchy-page__head">
        <div>
          <Stamp>Внутрішній доступ · Внутрішній розділ</Stamp>
          <h1>Ієрархія посад</h1>
          <p>
            Актуальний статус кожної посади. Натисніть на посаду, щоб
            переглянути опис обов'язків.
          </p>
        </div>

        <div className="hierarchy-filter">
          {(["all", "vacant", "limited", "occupied"] as const).map((f) => (
            <button
              key={f}
              className={`hierarchy-filter__btn${filter === f ? " hierarchy-filter__btn--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Усі" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="hierarchy-levels">
        {roleHierarchy.map((level) => {
          const roles = (filter === "all" ? level.roles : level.roles.filter((r) => getRoleData(r).status === filter))
            .map(getRoleData);
          if (roles.length === 0) return null;

          return (
            <div className="hierarchy-level" key={level.id}>
              <div className="hierarchy-level__label" style={{ ["--level-accent" as string]: level.colorAccent }}>
                <span className="hierarchy-level__dot" />
                {level.label}
              </div>
              <div className="hierarchy-level__grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className="role-card"
                    onClick={() => setSelected(role)}
                  >
                    <h3>{role.title}</h3>
                    <StatusBadge role={role} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="role-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="role-modal" onClick={(e) => e.stopPropagation()}>
            <button className="role-modal__close" onClick={() => setSelected(null)} aria-label="Закрити">
              <svg viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <h2>{selected.title}</h2>
            <StatusBadge role={selected} />
            <p>{selected.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}