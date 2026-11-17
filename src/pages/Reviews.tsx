import { ComingSoon } from "../components/ComingSoon";
import { PortalLayout } from "../components/PortalLayout";

export function ReviewsPage() {
  return (
    <PortalLayout title="Відгуки">
      <p className="p-lead">Відгуки про роботу закладу та лікарів.</p>
      <div className="p-block">
        <div className="p-block__head p-block__head--teal">Відгуки</div>
        <div className="p-block__body">
          <ComingSoon label="У розробці" />
        </div>
      </div>
    </PortalLayout>
  );
}
