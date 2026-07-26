import { staffMembers } from "../data/staff";
import { Stamp } from "../components/Stamp";
import "./StaffPage.css";

function Avatar({ gender }: { gender: "male" | "female" }) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 100 100" className="staff-card__avatar" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="var(--color-bg-muted)" />
        <circle cx="50" cy="38" r="14" fill="none" stroke="var(--color-ink-soft)" strokeWidth="2.4" />
        <path
          d="M50 24c-6.5 0-11.5 4-13.5 9.5"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M20 82c3.5-14 15-24 30-24s26.5 10 30 24"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="staff-card__avatar" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill="var(--color-bg-muted)" />
      <circle cx="50" cy="40" r="15" fill="none" stroke="var(--color-ink-soft)" strokeWidth="2.4" />
      <path
        d="M22 81c3-13 14-22 28-22s25 9 28 22"
        fill="none"
        stroke="var(--color-ink-soft)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StaffPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Stamp>Персонал лікарні · Працівники</Stamp>
          <h1>Працівники</h1>
          <p className="page-hero__lede">
            Керівний та медичний персонал лікарні. Фотографії будуть додані
            пізніше — наразі відображаються тимчасові заглушки.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="staff-members-grid">
            {staffMembers.map((member, i) => (
              <div className="staff-card" key={member.id} style={{ animationDelay: `${i * 60}ms` }}>
                <Avatar gender={member.gender} />
                <h2 className="staff-card__name">{member.fullName}</h2>
                <p className="staff-card__positions">{member.positions.join(", ")}</p>
                <p className="staff-card__departments">{member.departments.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}