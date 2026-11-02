import type { SVGProps } from "react";

const PATHS = {
  today: (
    <>
      <path d="M4 17h16" />
      <path d="M7 17a5 5 0 0 1 10 0" />
      <path d="M12 6V4M5.6 9.6 4.2 8.2M18.4 9.6l1.4-1.4M3 13H2M22 13h-1" />
      <path d="M8 20.5h8" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <ellipse cx="12" cy="12" rx="3.6" ry="4.6" />
      <path d="M4 12h2.5M17.5 12H20" />
    </>
  ),
  trial: (
    <>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M7.5 15.5 11 11l3 2.5 5-6.5" />
      <circle cx="19" cy="7" r="1" fill="currentColor" />
    </>
  ),
  breakout: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  claim: (
    <>
      <path d="M9 3h6v3l1.6 2.2A3 3 0 0 1 17 10v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a3 3 0 0 1 .4-1.8L9 6V3Z" />
      <path d="M7 12h10M10 15.5h4" />
    </>
  ),
  hands: (
    <>
      <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" />
      <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M14 11V6a1.5 1.5 0 0 1 3 0v7.5a6.5 6.5 0 0 1-6.5 6.5h-.6a5.5 5.5 0 0 1-4.3-2.1L3.8 15a1.6 1.6 0 0 1 2.5-2L8 15" />
    </>
  ),
  light: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  protocol: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="m8.5 11 1.5 1.5 3-3M8.5 16.5h7" />
    </>
  ),
  concealer: (
    <>
      <path d="M9 21h6a1 1 0 0 0 1-1V11H8v9a1 1 0 0 0 1 1Z" />
      <path d="M9.5 11V7.5L12 3l2.5 4.5V11" />
      <path d="M8 15h8" />
    </>
  ),
  retail: (
    <>
      <path d="M4 9h16l-1 11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1L4 9Z" />
      <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
      <path d="M9 14h6" />
    </>
  ),
  lab: (
    <>
      <path d="M9.5 3h5M10 3v6L4.8 18.2A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.8L14 9V3" />
      <path d="M7.2 14h9.6" />
    </>
  ),
  privacy: (
    <>
      <path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9.2 12 2 2 3.8-4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
      <path d="M6.5 12.5h3l1.5-2.5 2 4 1.5-1.5h3" />
    </>
  ),
  droplet: <path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5Z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.6v.2" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4.5M12 17.2v.2" />
    </>
  ),
  watch: (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <path d="M9 6.8 9.6 3h4.8l.6 3.8M9 17.2l.6 3.8h4.8l.6-3.8M12 9.8V12l1.5 1.2" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.4" />
      <path d="M11 5.5h2" />
    </>
  ),
  laptop: (
    <>
      <rect x="4.5" y="5" width="15" height="10" rx="1.4" />
      <path d="M2.5 18.5h19l-1.5-3.5H4l-1.5 3.5Z" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.7 4.2 2.3 5.8 6.5 6.5-4.2.7-5.8 2.3-6.5 6.5-.7-4.2-2.3-5.8-6.5-6.5 4.2-.7 5.8-2.3 6.5-6.5Z" />
      <path d="M19 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V7M3 14h18v4M21 14v-2.5a3 3 0 0 0-3-3h-7v5.5" />
      <circle cx="7" cy="11" r="1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" />
      <path d="M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2.2l1.5-2.2h5.6L16.3 7h2.2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.8" r="3.4" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.5" y="7.5" width="17" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-8.5Z" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, strokeWidth = 1.6, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
