import { staffMembers } from "../data/staff";
import { PortalLayout } from "../components/PortalLayout";
import "./StaffPage.css";

function Avatar({ gender }: { gender: "male" | "female" }) {
  const src =
    gender === "female"
      ? `${import.meta.env.BASE_URL}avatars/woman-placeholder.png`
      : `${import.meta.env.BASE_URL}avatars/man-placeholder.png`;
  return <img src={src} alt="" className="staff-card__avatar" />;
}

export function StaffPage() {
  return (
    <PortalLayout title="Працівники лікарні">
      <p className="p-lead">
        Керівний та медичний персонал лікарні. Фотографії будуть додані
        пізніше — наразі відображаються тимчасові заглушки.
      </p>

      <div className="p-block">
        <div className="p-block__head">Штат працівників</div>
        <ul className="staff-list">
          {staffMembers.map((member) => (
            <li key={member.id} className="staff-list__item">
              <Avatar gender={member.gender} />
              <div className="staff-list__text">
                <strong>{member.fullName}</strong>
                <span>{member.positions.join(", ")}</span>
                <span className="staff-list__dept">{member.departments.join(", ")}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PortalLayout>
  );
}
