import { useParams } from "react-router-dom";
import { Link } from "../components/AppLink";
import { departments, separateUnits } from "../data/hierarchy";
import { staffMembers } from "../data/staff";
import { PortalLayout } from "../components/PortalLayout";
import "./DepartmentsPage.css";

function PersonAvatar({ gender }: { gender: "male" | "female" }) {
  const src =
    gender === "female"
      ? `${import.meta.env.BASE_URL}avatars/woman-placeholder.png`
      : `${import.meta.env.BASE_URL}avatars/man-placeholder.png`;
  return <img src={src} alt="" className="staff-card__avatar" />;
}

export function DepartmentsPage() {
  const { deptId } = useParams();

  if (deptId) {
    return <DepartmentStaffPage deptId={deptId} />;
  }

  return (
    <PortalLayout title="Відділення лікарні">
      <p className="p-lead">
        Персонал лікарні організовано за відділеннями. Оберіть відділення, щоб
        переглянути працівників.
      </p>

      <div className="p-block">
        <div className="p-block__head">Структура закладу</div>
        <ul className="dept-list">
          {departments.map((dept, i) => (
            <li key={dept.id}>
              <Link to={`/viddilennya/${dept.id}`} className="dept-list__item">
                <span className="dept-list__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="dept-list__body">
                  <strong>{dept.name}</strong>
                  <span>{dept.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Окремі підрозділи</div>
        <ul className="dept-list">
          {separateUnits.map((unit, i) => (
            <li key={unit.id}>
              <div className="dept-list__item" style={{ cursor: "default" }}>
                <span className="dept-list__index">{String(i + 1).padStart(2, "0")}</span>
                <span className="dept-list__body">
                  <strong>{unit.name}</strong>
                  <span>{unit.description}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </PortalLayout>
  );
}

function DepartmentStaffPage({ deptId }: { deptId: string }) {
  const dept = departments.find((d) => d.id === deptId);
  const deptStaff = staffMembers.filter((m) =>
    m.departments.some((d) => d.toLowerCase().includes(dept?.name.toLowerCase() ?? "")),
  );

  if (!dept) {
    return null;
  }

  return (
    <PortalLayout title={dept.name}>
      <p className="p-lead">{dept.description}</p>

      <p className="dept-back">
        <Link to="/viddilennya">← Усі відділення</Link>
      </p>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Працівники відділення</div>
        <div className="p-block__body">
          {deptStaff.length === 0 ? (
            <p style={{ color: "var(--color-ink-soft)", fontStyle: "italic" }}>
              Інформація про працівників уточнюється.
            </p>
          ) : (
            <ul className="staff-list">
              {deptStaff.map((member) => (
                <li key={member.id} className="staff-list__item">
                  <PersonAvatar gender={member.gender} />
                  <div className="staff-list__text">
                    <strong>{member.fullName}</strong>
                    <span>{member.positions.join(", ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
