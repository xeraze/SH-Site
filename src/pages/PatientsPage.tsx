import { PortalLayout } from "../components/PortalLayout";
import { ComingSoon } from "../components/ComingSoon";

export function PatientsPage() {
  return (
    <PortalLayout title="Для пацієнтів">
      <p className="p-lead">
        Інформація для пацієнтів лікарні: путівник, вартість послуг та умови
        отримання допомоги.
      </p>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Путівник лікарнею</div>
        <div className="p-block__body">
          <ComingSoon label="Розділ у розробці" />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Вартість послуг</div>
        <div className="p-block__body">
          <ComingSoon label="Розділ у розробці" />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">НСЗУ</div>
        <div className="p-block__body">
          <ComingSoon label="Розділ у розробці" />
        </div>
      </div>

      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Страхування</div>
        <div className="p-block__body">
          <ComingSoon label="Розділ у розробці" />
        </div>
      </div>
    </PortalLayout>
  );
}
