import { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { departments } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import { pluralizePosady } from "../utils/pluralize";
import "./DepartmentsPage.css";

function PersonAvatar() {
  return (
    <span className="person-avatar" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function countRoles(deptId?: string) {
  const list = deptId ? departments.filter((d) => d.id === deptId) : departments;
  return list.reduce((sum, d) => sum + d.staffGroups.reduce((s, g) => s + g.roles.length, 0), 0);
}

export function DepartmentsPage() {
  const { deptId } = useParams();

  if (deptId) {
    return <DepartmentStaffPage deptId={deptId} />;
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>Структура лікарні · Персонал за відділеннями</Stamp>
          <h1>Відділення</h1>
          <p className="page-hero__lede">
            Персонал лікарні організовано за відділеннями. Оберіть відділення,
            щоб переглянути його керівництво та штат співробітників.
          </p>
        </div>
      </section>

      <section className="section staff-section">
        <div className="container">
          <div className="departments__grid">
            {departments.map((dept, i) => {
              const roleCount = countRoles(dept.id);
              return (
                <Link
                  to={`/viddilennya/${dept.id}`}
                  className="dept-card"
                  key={dept.id}
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <span className="dept-card__index">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{dept.name}</h3>
                  <p>{dept.description}</p>
                  <span className="dept-card__count">
                    {roleCount} {pluralizePosady(roleCount)}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function DepartmentStaffPage({ deptId }: { deptId: string }) {
  const dept = departments.find((d) => d.id === deptId);
  const [openGroup, setOpenGroup] = useState<string | null>(dept?.staffGroups[0]?.id ?? null);

  if (!dept) {
    return <Navigate to="/viddilennya" replace />;
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>{`Структура лікарні · ${dept.name}`}</Stamp>
          <h1>{dept.name}</h1>
          <p className="page-hero__lede">{dept.description}</p>
          <Link to="/viddilennya" className="staff-back-link">
            ← Усі відділення
          </Link>
        </div>
      </section>

      <section className="section staff-section">
        <div className="container">
          <div className="staff-ladder">
            {dept.staffGroups.map((group, groupIndex) => {
              const isOpen = openGroup === group.id;
              return (
                <div className="staff-level" key={group.id}>
                  <button
                    className={`staff-level__header${isOpen ? " staff-level__header--open" : ""}`}
                    onClick={() => setOpenGroup(isOpen ? null : group.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="staff-level__rank">
                      {String(groupIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="staff-level__label">{group.label}</span>
                    <span className="staff-level__count">
                      {group.roles.length} {pluralizePosady(group.roles.length)}
                    </span>
                    <svg className="staff-level__chevron" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 6l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <div className={`staff-level__body${isOpen ? " staff-level__body--open" : ""}`}>
                    <div className="staff-level__body-inner">
                      {group.description && (
                        <p className="staff-level__description">{group.description}</p>
                      )}
                      {group.procedures && group.procedures.length > 0 && (
                        <div className="staff-level__procedures">
                          <span className="staff-level__procedures-title">
                            Кабінети / види досліджень:
                          </span>
                          <ul>
                            {group.procedures.map((proc) => (
                              <li key={proc}>{proc}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="staff-level__roles">
                        {group.roles.map((role) => (
                          <div className="role-chip role-chip--person" key={role.id}>
                            <PersonAvatar />
                            <div className="role-chip__text">
                              <h3>{role.title}</h3>
                              {role.description && <p>{role.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}