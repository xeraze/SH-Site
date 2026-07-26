import "./ComingSoon.css";

export function ComingSoon({ label }: { label?: string }) {
  return (
    <div className="coming-soon">
      <span className="coming-soon__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
          <path d="M12 7.5v5l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{label ?? "Розділ у розробці"}</span>
    </div>
  );
}