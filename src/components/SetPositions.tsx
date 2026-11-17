import { useEffect, useState } from "react";
import {
  assignRole,
  fetchInvites,
  fetchPersonalizationRegistry,
  fetchStaffEmployees,
  revokeRole,
  savePersonalization,
  setSpecialization,
  type PersonalizationCategory,
  type PersonalizationItem,
} from "../api";
import { POSITION_GROUPS, ROLE_LABELS_UI, positionOf } from "../data/positions";
import { ConfettiOnMount } from "./Confetti";

export function SetPositionsModal({
  user,
  onClose,
}: {
  user: { id: string; name: string; email?: string | null };
  onClose: () => void;
}) {
  const [assignable, setAssignable] = useState<string[]>([]);
  const [registry, setRegistry] = useState<{
    categories: PersonalizationCategory[];
    items: PersonalizationItem[];
  } | null>(null);
  const [initialPositions, setInitialPositions] = useState<string[]>([]);
  const [initialPers, setInitialPers] = useState<string[]>([]);
  const [initialSpec, setInitialSpec] = useState("");
  const [positions, setPositions] = useState<Set<string>>(new Set());
  const [pers, setPers] = useState<Set<string>>(new Set());
  const [spec, setSpec] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [invites, reg, list] = await Promise.all([
        fetchInvites(),
        fetchPersonalizationRegistry(),
        fetchStaffEmployees(),
      ]);
      setAssignable(invites.assignable);
      setRegistry(reg);
      const found = list.find((e) => e.id === user.id);
      if (found) {
        const pos = found.roles.filter((r) => r !== "patient" && r !== "employee");
        setInitialPositions(pos);
        setPositions(new Set(pos));
        setInitialPers(found.personalization);
        setPers(new Set(found.personalization));
        setSpec(found.specialization ?? "");
        setInitialSpec(found.specialization ?? "");
      }
      setLoading(false);
    })();
  }, [user.id]);

  const canAssign = assignable.length > 0 && !!user.email;

  const toggle = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id);
    else next.delete(id);
    return next;
  };

  const onSave = async () => {
    if (!user.email) return;
    const email = user.email;
    setBusy(true);
    setMsg(null);
    const errors: string[] = [];

    for (const role of assignable) {
      const want = positions.has(role);
      const had = initialPositions.includes(role);
      if (want === had) continue;
      const res = want ? await assignRole(email, role) : await revokeRole(email, role);
      if (!res.ok) errors.push(`${ROLE_LABELS_UI[role] ?? role}: ${res.error}`);
    }

    const persChanged =
      pers.size !== initialPers.length || [...pers].some((p) => !initialPers.includes(p));
    if (persChanged) {
      const res = await savePersonalization(email, [...pers]);
      if (!res.ok) errors.push(res.error);
    }

    const nextSpec = spec.trim();
    if (nextSpec !== initialSpec) {
      const res = await setSpecialization(email, nextSpec);
      if (!res.ok) errors.push(res.error);
    }

    setBusy(false);
    setMsg(
      errors.length > 0
        ? errors.join("; ")
        : "Збережено: посади, спеціалізація та ролі оновлено.",
    );
    if (errors.length === 0) {
      const list = await fetchStaffEmployees();
      const found = list.find((e) => e.id === user.id);
      if (found) {
        const pos = found.roles.filter((r) => r !== "patient" && r !== "employee");
        setInitialPositions(pos);
        setPositions(new Set(pos));
        setInitialPers(found.personalization);
        setPers(new Set(found.personalization));
        setSpec(found.specialization ?? "");
        setInitialSpec(found.specialization ?? "");
      }
    }
  };

  return (
    <div className="users-modal-overlay" onClick={onClose}>
      <div className="users-modal" onClick={(e) => e.stopPropagation()}>
        <ConfettiOnMount />
        <div className="users-modal__head">
          <strong>Призначення — {user.name}</strong>
          <button type="button" className="profile-modal__close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="users-modal__scroll staff-manage">
          <p className="cabinet-profile-note">
            Статус «Працівник лікарні» надано автоматично разом із прийняттям
            заявки на посаду. Вкажіть посади, спеціалізацію та видимі в профілі ролі —
            за потребою одразу або пізніше в «Управлінні».
          </p>
          {loading && <p className="cabinet-profile-note">Завантаження...</p>}
          {!loading && !canAssign && (
            <p className="cabinet-profile-note">
              Недостатньо прав для призначення посад — зверніться до того, хто
              має право керування.
            </p>
          )}
          {!loading && canAssign && (
            <>
              <section className="staff-manage__section">
                <h4 className="staff-manage__title">Посади</h4>
                <p className="cabinet-profile-note">
                  Посади надають права на сайті. Свою посаду та вище видати неможливо.
                </p>
                {POSITION_GROUPS.map((group) => {
                  const list = assignable.filter((r) => positionOf(r)?.group === group.id);
                  if (list.length === 0) return null;
                  return (
                    <fieldset key={group.id} className="p-personalization__group">
                      <legend>{group.label}</legend>
                      {list.map((r) => (
                        <label key={r} className="p-personalization__option">
                          <input
                            type="checkbox"
                            disabled={busy}
                            checked={positions.has(r)}
                            onChange={(e) =>
                              setPositions((prev) => toggle(prev, r, e.target.checked))
                            }
                          />
                          {ROLE_LABELS_UI[r] ?? r}
                        </label>
                      ))}
                    </fieldset>
                  );
                })}
              </section>
              <section className="staff-manage__section">
                <h4 className="staff-manage__title">Спеціалізація</h4>
                <p className="cabinet-profile-note">
                  Напрям роботи, наприклад: кардіолог. Відображається в профілі.
                </p>
                <div className="staff-manage__row">
                  <input
                    type="text"
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    placeholder="Наприклад: кардіолог"
                    maxLength={200}
                    disabled={busy}
                  />
                </div>
              </section>
              <section className="staff-manage__section">
                <h4 className="staff-manage__title">Ролі (персоналізація)</h4>
                <p className="cabinet-profile-note">
                  Видима в профілі інформація: підрозділ тощо. Прав не
                  надає.
                </p>
                {registry &&
                  registry.categories.map((cat) => {
                    const list = registry.items.filter((i) => i.category === cat.id);
                    if (list.length === 0) return null;
                    return (
                      <fieldset key={cat.id} className="p-personalization__group">
                        <legend>{cat.label}</legend>
                        {list.map((item) => (
                          <label key={item.id} className="p-personalization__option">
                            <input
                              type="checkbox"
                              disabled={busy}
                              checked={pers.has(item.id)}
                              onChange={(e) =>
                                setPers((prev) => toggle(prev, item.id, e.target.checked))
                              }
                            />
                            {item.label}
                          </label>
                        ))}
                      </fieldset>
                    );
                  })}
              </section>
              <button
                type="button"
                className="portal-cta"
                disabled={busy}
                onClick={() => void onSave()}
              >
                {busy ? "..." : "Зберегти все"}
              </button>
            </>
          )}
          {msg && <p className="cabinet-profile-note">{msg}</p>}
          <button type="button" className="cabinet-logout" onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
