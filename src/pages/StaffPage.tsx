import { staffMembers } from "../data/staff";
import { Stamp } from "../components/Stamp";
import "./StaffPage.css";

function Avatar({ gender }: { gender: "male" | "female" }) {
  if (gender === "female") {
    return (
      <svg viewBox="0 0 100 100" className="staff-card__avatar" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="var(--color-bg-muted)" />
        <path
          d="M50 24c-9 0-16 7.5-16 17 0 6.5 3 12.3 8 15.7-11 3.6-19 12.7-21.5 24.3h59c-2.5-11.6-10.5-20.7-21.5-24.3 5-3.4 8-9.2 8-15.7 0-9.5-7-17-16-17Z"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M34 44c4 2 10 3 16 3s12-1 16-3"
          fill="none"
          stroke="var(--color-ink-soft)"
          strokeWidth="2"
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
          <Stamp>Персонал лікарні · Співробітники</Stamp>
          <h1>Співробітники</h1>
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