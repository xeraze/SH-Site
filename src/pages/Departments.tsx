import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Link } from "../components/AppLink";
import { departments } from "../data/hierarchy";
import { positionOf } from "../data/positions";
import { fetchDepartmentStaffOnce, type DepartmentStaffItem } from "../api";
import { ROLE_LABELS_UI } from "../data/status";
import { PortalLayout } from "../components/PortalLayout";
import { ProfileModal, type ProfileUser } from "../components/Profile";
import "./Departments.css";

function useDepartmentStaff(): DepartmentStaffItem[] | null {
  const [staff, setStaff] = useState<DepartmentStaffItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchDepartmentStaffOnce().then((items) => {
      if (alive) setStaff(items);
    });
    return () => {
      alive = false;
    };
  }, []);

  return staff;
}

function positionLabels(roles: string[]): string {
  return roles
    .filter((r) => r !== "patient" && r !== "employee" && r !== "sysadmin")
    .map((r) => ROLE_LABELS_UI[r] ?? r)
    .join(", ");
}

function staffRank(person: DepartmentStaffItem): number {
  let rank = -1;
  for (const role of person.roles) {
    const pos = positionOf(role);
    if (pos && pos.id !== "patient") rank = Math.max(rank, pos.rank);
  }
  return rank;
}

function sortStaff(list: DepartmentStaffItem[]): DepartmentStaffItem[] {
  return [...list].sort(
    (a, b) => staffRank(b) - staffRank(a) || a.name.localeCompare(b.name, "uk"),
  );
}

function PersonAvatar({ person }: { person: DepartmentStaffItem }) {
  if (person.avatar) {
    return <img src={person.avatar} alt="" className="staff-card__avatar" />;
  }
  const src =
    person.gender === "female"
      ? `${import.meta.env.BASE_URL}avatars/woman-placeholder.png`
      : `${import.meta.env.BASE_URL}avatars/man-placeholder.png`;
  return <img src={src} alt="" className="staff-card__avatar" />;
}

function StaffCard({
  person,
  onOpen,
}: {
  person: DepartmentStaffItem;
  onOpen: (person: DepartmentStaffItem) => void;
}) {
  const positions = positionLabels(person.roles);
  const open = () => onOpen(person);
  return (
    <li
      className="staff-list__item staff-list__item--open"
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
    >
      <PersonAvatar person={person} />
      <div className="staff-list__text">
        <strong>{person.name}</strong>
        {positions && <span>{positions}</span>}
        {person.specialization?.trim() && (
          <span className="staff-list__spec">{person.specialization.trim()}</span>
        )}
      </div>
      {person.staffStatus === "vacation" && (
        <span className="staff-list__flag">У відпустці</span>
      )}
      <Icon icon="mdi:chevron-right" width={16} height={16} className="staff-list__chevron" />
    </li>
  );
}

function toProfileUser(person: DepartmentStaffItem): ProfileUser {
  return {
    id: person.id,
    name: person.name,
    age: person.age,
    bio: person.bio,
    specialization: person.specialization,
    personalization: person.personalization,
    avatar: person.avatar,
    roles: person.roles,
    staffStatus: person.staffStatus,
  };
}

export function DepartmentsPage() {
  const { deptId } = useParams();
  const staff = useDepartmentStaff();
  const [profile, setProfile] = useState<ProfileUser | null>(null);

  const modal = profile ? (
    <ProfileModal user={profile} variant="public" onClose={() => setProfile(null)} />
  ) : null;

  if (deptId) {
    const dept = departments.find((d) => d.id === deptId);

    if (!dept) {
      return (
        <PortalLayout title="Відділення лікарні">
          <p className="p-lead">Відділення не знайдено.</p>
          <p className="dept-back">
            <Link to="/departments">← Усі відділення</Link>
          </p>
        </PortalLayout>
      );
    }

    const deptStaff = sortStaff(
      (staff ?? []).filter((s) => s.personalization.includes(dept.id)),
    );

    return (
      <PortalLayout title={dept.name}>
        <p className="p-lead">{dept.description}</p>

        <p className="dept-back">
          <Link to="/departments">← Усі відділення</Link>
        </p>

        <div className="p-block">
          <div className="p-block__head p-block__head--teal">
            Працівники відділення
            {staff && <span className="p-block__count">{deptStaff.length}</span>}
          </div>
          <div className="p-block__body">
            {staff === null ? (
              <p className="dept-note">Завантаження…</p>
            ) : deptStaff.length === 0 ? (
              <p className="dept-note">У цьому відділенні поки що немає працівників.</p>
            ) : (
              <ul className="staff-list">
                {deptStaff.map((person) => (
                  <StaffCard
                    key={person.id}
                    person={person}
                    onOpen={(p) => setProfile(toProfileUser(p))}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
        {modal}
      </PortalLayout>
    );
  }

  const counts = new Map<string, number>();
  for (const person of staff ?? []) {
    for (const deptIdKey of person.personalization) {
      counts.set(deptIdKey, (counts.get(deptIdKey) ?? 0) + 1);
    }
  }

  return (
    <PortalLayout title="Відділення лікарні">
      <p className="p-lead">
        Персонал лікарні розподілено за відділеннями.
        Оберіть відділення, щоб переглянути інформацію про це відділення або про працівників цього відділення.
      </p>

      <div className="p-block">
        <div className="p-block__head">
          Структура закладу
          {staff && <span className="p-block__count">{departments.length}</span>}
        </div>
        <ul className="dept-list">
          {departments.map((dept, i) => {
            const count = counts.get(dept.id) ?? 0;
            return (
              <li key={dept.id}>
                <Link to={`/departments/${dept.id}`} className="dept-list__item">
                  <span className="dept-list__index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="dept-list__body">
                    <strong>{dept.name}</strong>
                    <span>{dept.description}</span>
                    {staff && count === 0 && (
                      <span className="dept-list__empty">Працівників поки немає.</span>
                    )}
                  </span>
                  {staff ? (
                    <span
                      className={`dept-list__count${count === 0 ? " dept-list__count--empty" : ""}`}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="dept-list__count dept-list__count--empty">…</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </PortalLayout>
  );
}
