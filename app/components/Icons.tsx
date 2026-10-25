type Props = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const SearchIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const BellIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export const GearIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const LogoutIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const HomeIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </svg>
);

export const UsersIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7" />
    <path d="M18 14.3c2 .8 3.5 2.7 3.5 5.7" />
  </svg>
);

export const TrendIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const CheckCircleIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 3 3 5-6" />
  </svg>
);

export const ClockIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const XCircleIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6M15 9l-6 6" />
  </svg>
);

export const ArrowUpIcon = ({ size = 22, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20V4" />
    <path d="m5 11 7-7 7 7" />
  </svg>
);

export const FileIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6M9 17h6" />
  </svg>
);

export const UserIcon = ({ size = 26, className }: Props) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export const SchoolArt = ({ width = 340 }: { width?: number }) => (
  <svg width={width} viewBox="0 0 340 170" aria-hidden>
    <ellipse cx="170" cy="150" rx="165" ry="16" fill="#25a83a" />
    <rect x="30" y="70" width="280" height="76" fill="#f08a00" stroke="#222" strokeWidth="3" />
    <path d="M22 70 40 36h260l18 34z" fill="#e50019" stroke="#222" strokeWidth="3" />
    <rect x="115" y="18" width="110" height="128" fill="#f08a00" stroke="#222" strokeWidth="3" />
    <path d="M105 34 125 6h90l20 28z" fill="#e50019" stroke="#222" strokeWidth="3" />
    {[48, 82, 224, 258].map((x) => (
      <g key={x}>
        <rect x={x} y="84" width="26" height="20" fill="#7fd0f5" stroke="#222" strokeWidth="2" />
        <rect x={x} y="114" width="26" height="20" fill="#7fd0f5" stroke="#222" strokeWidth="2" />
      </g>
    ))}
    {[128, 188].map((x) => (
      <g key={x}>
        <rect x={x} y="44" width="22" height="18" fill="#7fd0f5" stroke="#222" strokeWidth="2" />
        <rect x={x} y="72" width="22" height="18" fill="#7fd0f5" stroke="#222" strokeWidth="2" />
      </g>
    ))}
    <rect x="144" y="108" width="52" height="38" fill="#9ad8f0" stroke="#222" strokeWidth="3" />
    <path d="M170 108v38" stroke="#222" strokeWidth="2" />
  </svg>
);
