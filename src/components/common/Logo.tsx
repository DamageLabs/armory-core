export default function Logo({ width = 280, height = 48 }: { width?: number; height?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 48" width={width} height={height}>
      <defs>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#2563EB' }} />
          <stop offset="100%" style={{ stopColor: '#1D4ED8' }} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="44" height="44" rx="8" fill="url(#iconGrad)" />
      <circle cx="22" cy="22" r="11" fill="none" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <circle cx="22" cy="22" r="3" fill="white" />
      <line x1="22" y1="8" x2="22" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="30" x2="22" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="22" x2="14" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="30" y1="22" x2="36" y2="22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <text x="56" y="30" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="22" fontWeight="600" fill="#000000" letterSpacing="-0.3">Armory</text>
      <text x="136" y="30" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="22" fontWeight="600" fill="#2563EB" letterSpacing="-0.3">Core</text>
    </svg>
  );
}
