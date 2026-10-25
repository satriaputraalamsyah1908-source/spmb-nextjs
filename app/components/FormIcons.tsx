type P = { size?: number; className?: string };

const line = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

const solid = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
});

export const PersonFill = ({ size = 44, className }: P) => (
  <svg {...solid(size)} className={className}>
    <circle cx="12" cy="7.5" r="4.5" />
    <path d="M3 21c0-4.6 4-7.5 9-7.5s9 2.9 9 7.5z" />
  </svg>
);

export const HomeFill = ({ size = 36, className }: P) => (
  <svg {...solid(size)} className={className}>
    <path d="M12 2 1.5 11.5H5V21h5.5v-6h3v6H19v-9.5h3.5z" />
  </svg>
);

export const IdCard = ({ size = 44, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={2}>
    <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
    <circle cx="8.5" cy="10.5" r="1.9" fill="currentColor" />
    <path d="M5.5 16c.5-2 5-2 6 0M14 9.5h4.5M14 13h4.5" />
  </svg>
);

export const GradCap = ({ size = 44, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.9}>
    <path d="m12 3-10 5 10 5 10-5z" />
    <path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
    <path d="M22 8v6" />
  </svg>
);

export const DiamondGrid = ({ size = 44, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.7}>
    <rect x="5" y="5" width="14" height="14" rx="3" transform="rotate(45 12 12)" />
    <path d="m8 8 8 8M16 8l-8 8" />
  </svg>
);

export const ChevronDown = ({ size = 40, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.6}>
    <path d="m3 8 9 8 9-8" />
  </svg>
);

export const CloudUpload = ({ size = 56, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.3}>
    <path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97" />
    <path d="M12 21v-9m0 0-3 3m3-3 3 3" />
  </svg>
);

export const SaveIcon = ({ size = 40, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.8}>
    <path d="M5 3h11l3.5 3.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    <path d="M7 3v5h8V3M7 21v-7h10v7" />
  </svg>
);

export const ClipboardList = ({ size = 40, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={1.5}>
    <rect x="3" y="3" width="15" height="18" rx="2" />
    <path d="M6.5 8h2M11 8h4M6.5 12h2M11 12h4M6.5 16h2M11 16h4" />
    <path d="M20 6v10l-1.2 2L17.6 16V6" />
  </svg>
);

export const ClipboardChart = ({ size = 40, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={2}>
    <rect x="3.5" y="4.5" width="17" height="17" rx="2" />
    <path d="M9 4.5V3h6v1.5M8 18v-5M12 18V9M16 18v-3" />
  </svg>
);

export const HouseUser = ({ size = 110, className }: P) => (
  <svg {...line(size)} className={className} strokeWidth={0.9}>
    <path d="M3 10.5 12 2l9 8.5V22H3z" />
    <circle cx="12" cy="10" r="2.3" />
    <path d="M9.4 22v-5.5c0-1.4 1.1-2.4 2.6-2.4s2.6 1 2.6 2.4V22" />
  </svg>
);

export const LockIcon = ({ size = 36, className }: P) => (
  <svg {...solid(size)} className={className} fillRule="evenodd">
    <path d="M7 10V7a5 5 0 0 1 10 0v3h1.5A1.5 1.5 0 0 1 20 11.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20.5v-9A1.5 1.5 0 0 1 5.5 10H7zm2 0h6V7a3 3 0 0 0-6 0v3zm3 4.5a1.8 1.8 0 0 0-1 3.3V20h2v-2.2a1.8 1.8 0 0 0-1-3.3z" />
  </svg>
);

export const WalletIcon = ({ size = 44, className }: P) => (
  <svg {...solid(size)} className={className} fillRule="evenodd">
    <path d="M4 5h13a2 2 0 0 1 2 2v1h-1.5A2.5 2.5 0 0 0 15 10.5v3a2.5 2.5 0 0 0 2.5 2.5H19v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="M16.5 10H21a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-4.5a1.5 1.5 0 0 1-1.5-1.5v-2a1.5 1.5 0 0 1 1.5-1.5zm1.2 1.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  </svg>
);
