import { useState } from "react";
import { Link } from "react-router-dom";
import { roleHierarchy } from "../data/hierarchy";
import { Stamp } from "../components/Stamp";
import "./StaffPage.css";

export function StaffPage() {
  const [openLevel, setOpenLevel] = useState<string | null>(roleHierarchy[0]?.id ?? null);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>Реєстр посад · 6 рівнів</Stamp>
          <span className="eyebrow">Кадрова структура</span>
          <h1>Персонал лікарні</h1>
          <p className="page-hero__lede">
            Ієрархія посад лікарні — від Ради директорів до молодшого
            медичного персоналу. Кожен рівень має власну зону
            відповідальності в структурі закладу.
          </p>
        </div>
      </section>

      <section className="section staff-section">
        <div className="container">
          <div className="staff-ladder">
            {roleHierarchy.map((level, levelIndex) => {
              const isOpen = openLevel === level.id;
              return (
                <div className="staff-level" key={level.id}>
                  <button
                    className={`staff-level__header${isOpen ? " staff-level__header--open" : ""}`}
                    onClick={() => setOpenLevel(isOpen ? null : level.id)}
                    style={{ ["--level-accent" as string]: level.colorAccent }}
                    aria-expanded={isOpen}
                  >
                    <span className="staff-level__rank">
                      {String(levelIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="staff-level__label">{level.label}</span>
                    <span className="staff-level__count">
                      {level.roles.length} {pluralizePosady(level.roles.length)}
                    </span>
                    <svg
                      className="staff-level__chevron"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div className={`staff-level__body${isOpen ? " staff-level__body--open" : ""}`}>
                    <div className="staff-level__roles">
                      {level.roles.map((role) => (
                        <div className="role-chip" key={role.id}>
                          <h3>{role.title}</h3>
                          <p>{role.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="staff-cta">
            <div>
              <h2>Актуальні вакансії та статус посад</h2>
              <p>
                Інформацію про те, яка посада наразі вільна, а яка зайнята,
                бачать авторизовані працівники лікарні у Порталі для лікарів.
              </p>
            </div>
            <Link to="/portal" className="btn btn--primary">
              Перейти до порталу
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function pluralizePosady(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "посада";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "посади";
  return "посад";
}
