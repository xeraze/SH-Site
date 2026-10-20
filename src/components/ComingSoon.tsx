import { Icon } from "@iconify/react";
import "./ComingSoon.css";

export function ComingSoon({ label }: { label?: string }) {
  return (
    <div className="coming-soon">
      <span className="coming-soon__icon" aria-hidden="true">
        <Icon icon="mdi:clock-outline" width={24} height={24} />
      </span>
      <span>{label ?? "Розділ у розробці"}</span>
    </div>
  );
}
