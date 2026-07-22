interface StampProps {
  children: string;
}

/** Невеликий "штамп"-лейбл у стилі офіційного документа. */
export function Stamp({ children }: StampProps) {
  return <span className="stamp">{children}</span>;
}
