import "./Emblem.css";

interface EmblemProps {
  size?: number;
  animated?: boolean;
}

/**
 * Спрощена SVG-версія герба лікарні: щит з кадуцеєм та дубовим листям,
 * обрамлений круговим написом. Використовується як "жива печатка" сайту.
 */
export function Emblem({ size = 120, animated = true }: EmblemProps) {
  return (
    <div
      className={`emblem${animated ? " emblem--animated" : ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Герб КНП «Слобідська центральна районна лікарня» СМР"
    >
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <path
            id="emblem-ring-path"
            d="M 100,100 m -84,0 a 84,84 0 1,1 168,0 a 84,84 0 1,1 -168,0"
          />
        </defs>

        <circle cx="100" cy="100" r="96" fill="var(--color-bg-raised)" />
        <circle
          cx="100"
          cy="100"
          r="96"
          fill="none"
          stroke="var(--color-navy)"
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="var(--color-navy)"
          strokeWidth="1.2"
        />

        <text fill="var(--color-navy)" fontSize="11.2" fontFamily="var(--font-display)" letterSpacing="1.5">
          <textPath href="#emblem-ring-path" startOffset="1%">
            СЛОБІДСЬКА ЦЕНТРАЛЬНА РАЙОННА ЛІКАРНЯ · КНП СМР ·
          </textPath>
        </text>

        {/* Щит */}
        <path
          d="M64 62 H136 V112 C136 138 118 152 100 160 C82 152 64 138 64 112 Z"
          fill="var(--color-navy)"
        />
        <path
          d="M64 62 H136 V112 C136 138 118 152 100 160 C82 152 64 138 64 112 Z"
          fill="none"
          stroke="var(--color-bg-raised)"
          strokeWidth="1.5"
        />

        {/* Кадуцей */}
        <g className="emblem__staff" stroke="var(--color-bg-raised)" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <line x1="100" y1="76" x2="100" y2="140" />
          <path d="M100 84c-8 5-8 11 0 16s8 11 0 16s-8 11 0 16" />
          <path d="M100 84c8 5 8 11 0 16s-8 11 0 16s8 11 0 16" />
          <line x1="90" y1="90" x2="110" y2="90" />
          <path d="M86 87c0 5 4.5 5 4.5 0" />
          <path d="M114 87c0 5-4.5 5-4.5 0" />
        </g>

        {/* Дубове листя */}
        <g fill="var(--color-bg-raised)" opacity="0.92">
          <path d="M70 118c6-4 10-10 10-18c-8 2-14 8-14 18c-4-2-8-2-10 2c6 4 10 2 14-2z" />
          <path d="M130 118c-6-4-10-10-10-18c8 2 14 8 14 18c4-2 8-2 10 2c-6 4-10 2-14-2z" />
        </g>
      </svg>
    </div>
  );
}
