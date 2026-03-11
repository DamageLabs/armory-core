import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CContainer } from '@coreui/react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import AlertDisplay from '../common/AlertDisplay';
import ShortcutHelp from '../common/ShortcutHelp';
import { useKeyboardShortcuts, useShortcutHelp } from '../../hooks/useKeyboardShortcuts';

export default function Layout() {
  const { showHelp, openHelp, closeHelp } = useShortcutHelp();
  useKeyboardShortcuts(openHelp);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header onToggleSidebar={() => setSidebarVisible(true)} sidebarVisible={sidebarVisible} />
      <div className="d-flex flex-grow-1">
        <Sidebar visible={sidebarVisible} onVisibleChange={setSidebarVisible} />
        <main className="flex-grow-1 px-3 py-3">
          <CContainer lg>
            <AlertDisplay />
            <Outlet />
          </CContainer>
        </main>
      </div>
      <Footer />
      <ShortcutHelp show={showHelp} onClose={closeHelp} />
    </div>
  );
}
