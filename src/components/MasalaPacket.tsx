'use client';

interface MasalaPacketProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'red' | 'gold' | 'green' | 'saffron';
  animationDelay?: string;
  animationDuration?: string;
}

const VARIANTS = {
  red: {
    body: '#C8280A',
    bodyDark: '#8B1A07',
    bodyLight: '#E8401A',
    foil: '#FFE03A',
    foilDark: '#C8A800',
    label: '#FFF8E7',
    labelText: '#2D1B00',
    accent: '#FF8C00',
  },
  gold: {
    body: '#D4A017',
    bodyDark: '#9A7010',
    bodyLight: '#F0B820',
    foil: '#C8280A',
    foilDark: '#8B1A07',
    label: '#FFF8E7',
    labelText: '#2D1B00',
    accent: '#FF8C00',
  },
  green: {
    body: '#1A6B35',
    bodyDark: '#0F4020',
    bodyLight: '#2A8B45',
    foil: '#FFE03A',
    foilDark: '#C8A800',
    label: '#FFF8E7',
    labelText: '#0F4020',
    accent: '#22c55e',
  },
  saffron: {
    body: '#E85D04',
    bodyDark: '#B04000',
    bodyLight: '#FF7A20',
    foil: '#FFE03A',
    foilDark: '#C8A800',
    label: '#FFF8E7',
    labelText: '#2D1B00',
    accent: '#FF8C00',
  },
};

import { useId } from 'react';

export default function MasalaPacket({
  size = 80,
  style,
  className = '',
  variant = 'red',
  animationDelay = '0s',
  animationDuration = '6s',
}: MasalaPacketProps) {
  const c = VARIANTS[variant];
  const w = size;
  const h = size * 1.45;
  const rawId = useId();
  const id = `pkt-${variant}-${rawId.replace(/:/g, '')}`;

  return (
    <div
      className={`masala-packet-wrapper ${className}`}
      style={{
        width: w,
        height: h,
        animationDelay,
        animationDuration,
        ...style,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox="0 0 80 116"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.35))' }}
      >
        <defs>
          {/* Body gradient */}
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.bodyDark} />
            <stop offset="30%" stopColor={c.body} />
            <stop offset="55%" stopColor={c.bodyLight} />
            <stop offset="75%" stopColor={c.body} />
            <stop offset="100%" stopColor={c.bodyDark} />
          </linearGradient>

          {/* Foil gradient for top crimp */}
          <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.foilDark} />
            <stop offset="40%" stopColor={c.foil} />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="80%" stopColor={c.foil} />
            <stop offset="100%" stopColor={c.foilDark} />
          </linearGradient>

          {/* Shine sweep gradient */}
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="40%" stopColor="white" stopOpacity="0.18" />
            <stop offset="60%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          {/* Edge shadow gradient */}
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="black" stopOpacity="0.2" />
            <stop offset="100%" stopColor="black" stopOpacity="0.05" />
          </linearGradient>

          <clipPath id={`${id}-clip`}>
            <path d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z" />
          </clipPath>
        </defs>

        {/* ── Packet body ── */}
        <path
          d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z"
          fill={`url(#${id}-body)`}
        />

        {/* Body edge shadow */}
        <path
          d="M8 14 Q8 6 16 6 L64 6 Q72 6 72 14 L72 102 Q72 110 64 110 L16 110 Q8 110 8 102 Z"
          fill={`url(#${id}-edge)`}
        />

        {/* ── Foil top crimp area ── */}
        <rect x="6" y="4" width="68" height="22" rx="4" fill={`url(#${id}-foil)`} />

        {/* Crimp lines on top */}
        {[12, 18, 24, 30, 36, 42, 48, 54, 60, 66].map((x, i) => (
          <line
            key={i}
            x1={x} y1="4" x2={x - 2} y2="26"
            stroke={c.foilDark}
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
        ))}

        {/* Foil highlight line */}
        <rect x="6" y="4" width="68" height="3" rx="2" fill="white" fillOpacity="0.35" />

        {/* ── Bottom seal ── */}
        <rect x="6" y="100" width="68" height="14" rx="4" fill={`url(#${id}-foil)`} />
        {[12, 18, 24, 30, 36, 42, 48, 54, 60, 66].map((x, i) => (
          <line
            key={i}
            x1={x} y1="100" x2={x + 1} y2="114"
            stroke={c.foilDark}
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />
        ))}

        {/* ── Label area ── */}
        <rect
          x="12" y="34" width="56" height="62"
          rx="5"
          fill={c.label}
          stroke={c.foil}
          strokeWidth="1.5"
          clipPath={`url(#${id}-clip)`}
        />

        {/* Label inner border */}
        <rect
          x="15" y="37" width="50" height="56"
          rx="3"
          fill="none"
          stroke={c.accent}
          strokeWidth="1"
          strokeDasharray="3 2"
        />

        {/* Brand emoji area */}
        <circle cx="40" cy="53" r="11" fill={c.body} fillOpacity="0.12" />
        <text x="40" y="58" textAnchor="middle" fontSize="14" dominantBaseline="middle">🌶️</text>

        {/* Brand name */}
        <text
          x="40" y="72"
          textAnchor="middle"
          fontSize="5.5"
          fontWeight="bold"
          fill={c.labelText}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          AKSHAYA
        </text>
        <text
          x="40" y="79"
          textAnchor="middle"
          fontSize="5"
          fontWeight="bold"
          fill={c.body}
          fontFamily="sans-serif"
          letterSpacing="0.3"
        >
          SWADAM
        </text>

        {/* Product line */}
        <line x1="18" y1="82" x2="62" y2="82" stroke={c.accent} strokeWidth="0.7" strokeOpacity="0.6" />
        <text
          x="40" y="88"
          textAnchor="middle"
          fontSize="4.5"
          fill={c.labelText}
          fontFamily="sans-serif"
          fillOpacity="0.7"
        >
          Premium Masala
        </text>

        {/* Net weight */}
        <text
          x="40" y="93"
          textAnchor="middle"
          fontSize="3.8"
          fill={c.labelText}
          fontFamily="sans-serif"
          fillOpacity="0.55"
        >
          Net Wt. 100g
        </text>

        {/* ── Shine sweep (animated via CSS class) ── */}
        <rect
          x="0" y="0" width="80" height="116"
          fill={`url(#${id}-shine)`}
          clipPath={`url(#${id}-clip)`}
          className="packet-shine"
        />

        {/* Left edge highlight */}
        <path
          d="M8 20 Q8 6 16 6 L18 6 Q12 10 12 20 L12 100 Q12 108 18 110 L16 110 Q8 110 8 102 Z"
          fill="white"
          fillOpacity="0.12"
        />
      </svg>
    </div>
  );
}
