interface StampProps {
  children: string;
}

export function Stamp({ children }: StampProps) {
  const parts = children.split(" · ");
  return (
    <span className="stamp">
      {parts.map((part, i) => (
        <span key={i} className="stamp__part">
          {part}
        </span>
      ))}
    </span>
  );
}