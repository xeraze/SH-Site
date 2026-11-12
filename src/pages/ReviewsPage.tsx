import { ComingSoon } from "../components/ComingSoon";
import { PortalLayout } from "../components/PortalLayout";

export function ReviewsPage() {
  return (
    <PortalLayout title="Відгуки">
      <p className="p-lead">Відгуки про лікарів та роботу закладу.</p>
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Відгуки</div>
        <div className="p-block__body">
          <ComingSoon label="Розділ відгуків у розробці" />
        </div>
      </div>
    </PortalLayout>
  );
}
