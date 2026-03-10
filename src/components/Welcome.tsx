import { Container } from 'react-bootstrap';

function Logo({ width = 280, height = 48 }: { width?: number; height?: number }) {
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
      <text x="56" y="30" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="22" fontWeight="600" fill="#212529" letterSpacing="-0.3">Armory</text>
      <text x="136" y="30" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="22" fontWeight="600" fill="#2563EB" letterSpacing="-0.3">Core</text>
    </svg>
  );
}

export default function Welcome() {
  return (
    <div className="bg-light p-5 rounded">
      <Container>
        <div className="mb-4">
          <Logo width={350} height={60} />
        </div>
        <p className="lead">
          Armory Core is a complete firearm management system built for the demands of modern
          law enforcement, government agencies, private organizations that arm their personnel
          — and individual owners who take their collection seriously.
        </p>
        <p className="lead">
          By combining barcode technology, lean workflows, and intelligent automation, Armory
          Core eliminates the friction between departments — creating a seamless, end-to-end
          process for managing, tracking, and controlling firearms across your entire agency
          or personal collection.
        </p>
        <p className="lead">
          More than just software, Armory Core is an accountability engine. From issue to
          return, every transaction is logged, traceable, and audit-ready — helping your
          agency reduce liability and maintain ironclad control at every step. For private
          owners, that same precision means knowing exactly what you have, where it is, and
          what condition it's in — whether you own five firearms or five hundred.
        </p>
        <p>
          <a
            href="https://github.com/DamageLabs/armory-core"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            View on GitHub
          </a>
        </p>
      </Container>
    </div>
  );
}
