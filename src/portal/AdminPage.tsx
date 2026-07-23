import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { roleHierarchy, type RoleStatus } from "../data/hierarchy";
import "./AdminPage.css";

const WORKER_URL = import.meta.env.VITE_AUTH_WORKER_URL ?? "https://sh-site.xeraze-official.workers.dev";

export function AdminPage() {
  const { isAdmin } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`${WORKER_URL}/statuses`)
      .then((res) => res.json())
      .then((data) => {
        setStatuses(data.statuses || {});
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/portal/dashboard" replace />;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <span className="eyebrow">Панель керування</span>
        <h1>Управління статусами посад</h1>
        <p>
          Зміни, внесені тут, автоматично зберігаються на сервері та миттєво
          відображаються для всіх користувачів на сторінці ієрархії.
        </p>
      </div>

      {loading ? (
        <p>Завантаження статусів...</p>
      ) : (
        <div className="admin-grid">
          {roleHierarchy.flatMap((level) =>
            level.roles.map((role) => (
              <AdminRoleCard
                key={role.id}
                roleId={role.id}
                roleTitle={role.title}
                levelLabel={level.label}
                defaultStatus={role.status}
                defaultOccupied={role.occupied}
                defaultLimit={role.limit}
                savedData={statuses[role.id]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AdminRoleCard({
  roleId,
  roleTitle,
  levelLabel,
  defaultStatus,
  defaultOccupied,
  defaultLimit,
  savedData,
}: {
  roleId: string;
  roleTitle: string;
  levelLabel: string;
  defaultStatus: RoleStatus;
  defaultOccupied?: number;
  defaultLimit?: number;
  savedData?: any;
}) {
  const [status, setStatus] = useState<RoleStatus>(savedData?.status || defaultStatus);
  const [occupied, setOccupied] = useState<number>(savedData?.occupied ?? defaultOccupied ?? 0);
  const [limit, setLimit] = useState<number>(savedData?.limit ?? defaultLimit ?? 0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const hasChanges = () => {
    const current = savedData || { status: defaultStatus, occupied: defaultOccupied, limit: defaultLimit };
    if (status !== current.status) return true;
    if (status === "limited") {
      if (occupied !== (current.occupied ?? 0)) return true;
      if (limit !== (current.limit ?? 0)) return true;
    }
    return false;
  };

  async function handleSave() {
    setIsSaving(true);
    setMsg("");
    
    const payload = {
      roleId,
      status: {
        status,
        ...(status === "limited" ? { occupied, limit } : {})
      }
    };

    try {
      const token = sessionStorage.getItem("slobidska_portal_session");
      const res = await fetch(`${WORKER_URL}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");
      setMsg("Збережено!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Помилка!");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="admin-card">
      <div>
        <span className="admin-card__level">{levelLabel}</span>
        <h3>{roleTitle}</h3>
      </div>

      <div className="admin-form">
        <select
          className="admin-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as RoleStatus)}
        >
          <option value="vacant">Вільна</option>
          <option value="occupied">Зайнята</option>
          <option value="limited">Є місця</option>
        </select>

        {status === "limited" && (
          <div className="admin-limits">
            <input
              type="number"
              min="0"
              value={occupied}
              onChange={(e) => setOccupied(parseInt(e.target.value) || 0)}
            />
            <span>з</span>
            <input
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        <button
          className="admin-save"
          onClick={handleSave}
          disabled={!hasChanges() || isSaving}
        >
          {isSaving ? "Збереження..." : "Зберегти"}
        </button>
        {msg && <span className="admin-status-msg">{msg}</span>}
      </div>
    </div>
  );
}
