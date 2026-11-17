import { useEffect } from "react";
import "./Confetti.css";

const COLORS = [
  "var(--color-teal)",
  "var(--color-navy-deep)",
  "#e8c46a",
  "#f7f3e8",
  "var(--color-line-strong)",
];

function fireConfetti(): void {
  const host = document.createElement("div");
  host.className = "confetti";
  const count = 30;
  let maxEnd = 0;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti__piece";
    const delay = Math.random() * 0.35;
    const duration = 1.5 + Math.random() * 0.9;
    piece.style.left = `${4 + Math.random() * 92}%`;
    piece.style.width = `${6 + Math.round(Math.random() * 4)}px`;
    piece.style.height = `${8 + Math.round(Math.random() * 6)}px`;
    piece.style.background = COLORS[i % COLORS.length];
    piece.style.animationDelay = `${delay.toFixed(2)}s`;
    piece.style.animationDuration = `${duration.toFixed(2)}s`;
    piece.style.setProperty("--cf-drift", `${Math.round(Math.random() * 80 - 40)}px`);
    piece.style.setProperty("--cf-rot", `${Math.round(Math.random() * 720 - 360)}deg`);
    host.appendChild(piece);
    maxEnd = Math.max(maxEnd, delay + duration);
  }
  document.body.appendChild(host);
  window.setTimeout(() => host.remove(), (maxEnd + 0.4) * 1000);
}

export function ConfettiOnMount() {
  useEffect(() => {
    fireConfetti();
  }, []);
  return null;
}
