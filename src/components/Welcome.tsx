import { CContainer } from '@coreui/react';
import Logo from './common/Logo';

export default function Welcome() {
  return (
    <div className="bg-light p-5 rounded">
      <CContainer>
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
      </CContainer>
    </div>
  );
}
