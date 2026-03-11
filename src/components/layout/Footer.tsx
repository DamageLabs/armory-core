import { CFooter } from '@coreui/react';

export default function Footer() {
  return (
    <CFooter className="px-4">
      <div>
        Armory Core - Firearms Inventory Management System
      </div>
      <div className="ms-auto">
        <a
          href="https://github.com/DamageLabs/armory-core"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </div>
    </CFooter>
  );
}
