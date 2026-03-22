import { NavLink } from 'react-router-dom';
import {
  CSidebar,
  CSidebarNav,
  CNavGroup,
  CSidebarFooter,
  CSidebarToggler,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilSpeedometer,
  cilList,
  cilPlus,
  cilCloudDownload,
  cilCloudUpload,
  cilBarcode,
  cilPrint,
  cilBell,
  cilCopy,
  cilChartLine,
  cilChart,
  cilSwapHorizontal,
  cilDescription,
  cilLayers,
  cilPeople,
  cilSettings,
  cilApplications,
  cilHistory,
  cilNotes,
} from '@coreui/icons';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

function SidebarNavLink({ to, icon, children }: { to: string; icon: string[]; children: React.ReactNode }) {
  return (
    <li className="nav-item">
      <NavLink to={to} className="nav-link">
        <CIcon customClassName="nav-icon" icon={icon} />
        {children}
      </NavLink>
    </li>
  );
}

export default function Sidebar({ visible, onVisibleChange }: SidebarProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <CSidebar
      visible={visible}
      onVisibleChange={onVisibleChange}
    >
      <CSidebarNav>
        <SidebarNavLink to="/" icon={cilSpeedometer}>Home</SidebarNavLink>
        {isAuthenticated && (
          <>
            <CNavGroup toggler={<><CIcon customClassName="nav-icon" icon={cilList} /> Inventory</>}>
              <SidebarNavLink to="/items" icon={cilList}>All Items</SidebarNavLink>
              <SidebarNavLink to="/items/new" icon={cilPlus}>New Item</SidebarNavLink>
              <SidebarNavLink to="/items/import" icon={cilCloudUpload}>Import Data</SidebarNavLink>
              <SidebarNavLink to="/items/restore" icon={cilCloudDownload}>Restore Backup</SidebarNavLink>
              <SidebarNavLink to="/items/scanner" icon={cilBarcode}>Barcode Scanner</SidebarNavLink>
              <SidebarNavLink to="/items/labels" icon={cilPrint}>Print Labels</SidebarNavLink>
              <SidebarNavLink to="/items/reorder" icon={cilBell}>Reorder Alerts</SidebarNavLink>
              <SidebarNavLink to="/items/templates" icon={cilCopy}>Item Templates</SidebarNavLink>
            </CNavGroup>
            <CNavGroup toggler={<><CIcon customClassName="nav-icon" icon={cilChartLine} /> Reports</>}>
              <SidebarNavLink to="/reports" icon={cilSpeedometer}>Dashboard</SidebarNavLink>
              <SidebarNavLink to="/reports/valuation" icon={cilChart}>Inventory Valuation</SidebarNavLink>
              <SidebarNavLink to="/reports/movement" icon={cilSwapHorizontal}>Stock Movement</SidebarNavLink>
              <SidebarNavLink to="/reports/custom" icon={cilDescription}>Custom Report</SidebarNavLink>
              <SidebarNavLink to="/reports/maintenance" icon={cilNotes}>Maintenance</SidebarNavLink>
            </CNavGroup>
            <CNavGroup toggler={<><CIcon customClassName="nav-icon" icon={cilLayers} /> BOM</>}>
              <SidebarNavLink to="/bom" icon={cilLayers}>All BOMs</SidebarNavLink>
              <SidebarNavLink to="/bom/new" icon={cilPlus}>New BOM</SidebarNavLink>
            </CNavGroup>
          </>
        )}
        {isAdmin && (
          <CNavGroup toggler={<><CIcon customClassName="nav-icon" icon={cilSettings} /> Admin</>}>
            <SidebarNavLink to="/users" icon={cilPeople}>Users</SidebarNavLink>
            <SidebarNavLink to="/settings/categories" icon={cilApplications}>Categories</SidebarNavLink>
            <SidebarNavLink to="/settings/inventory-types" icon={cilSettings}>Inventory Types</SidebarNavLink>
            <SidebarNavLink to="/admin/audit-log" icon={cilHistory}>Audit Log</SidebarNavLink>
          </CNavGroup>
        )}
      </CSidebarNav>
      <CSidebarFooter>
        <CSidebarToggler onClick={() => onVisibleChange(!visible)} />
      </CSidebarFooter>
    </CSidebar>
  );
}
