import { staffMembers } from "../data/staff";
import { Stamp } from "../components/Stamp";
import "./StaffPage.css";

function Avatar({ gender }: { gender: "male" | "female" }) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 100 100" className="staff-card__avatar" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="var(--color-bg-muted)" />
        <path
          d="M50 23c-10 0-18 8-18 18 0 5 1.8 9.5 4.8 12.8-2 .6-3.8 1.3-3.8 1.3v7c4.6 2.6 10.7 4 17 4s12.4-1.4 17-4v-7s-1.8-.7-3.8-1.3c3-3.3 4.8-7.8 4.8-12.8 0-10-8-18-18-18Z"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="41" r="12" fill="none" stroke="var(--color-ink-soft)" strokeWidth="2.4" />
        <path
          d="M20 82c3.5-13.5 15-23 30-23s26.5 9.5 30 23"
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