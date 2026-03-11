import { CFooter } from '@coreui/react';

export default function Footer() {
  return (
    <CFooter className="px-4 justify-content-center flex-column text-center">
      <div>
        Armory Core - Firearms Inventory Management System
      </div>
      <div>
        <a
          href="https://github.com/DamageLabs/armory-core"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>
      <div className="text-muted">
        &copy; 2026 DamageLabs. All rights reserved.
      </div>
    </CFooter>
  );
}
