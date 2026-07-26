import { staffMembers } from "../data/staff";
import { Stamp } from "../components/Stamp";
import "./StaffPage.css";

function Avatar({ gender }: { gender: "male" | "female" }) {
  const src = gender === "female" ? "/SH-Site/avatars/woman-placeholder.png" : "/SH-Site/avatars/man-placeholder.png";
  return <img src={src} alt="" className="staff-card__avatar" />;
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