interface StampProps {
  children: string;
}

export function Stamp({ children }: StampProps) {
  return <span className="stamp">{children}</span>;
}