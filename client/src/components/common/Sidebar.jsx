import { NavLink } from 'react-router-dom';
import { X, LayoutDashboard, Users, FolderKanban, CheckSquare, CreditCard, Building2, LogOut, Settings, Upload, FilePlus2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import Logo from './Logo';

const navItems = {
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/clients', icon: Building2, label: 'Clients' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/invoices', icon: CreditCard, label: 'Invoices' },
    { to: '/files', icon: Upload, label: 'Files' },
  ],
  manager: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/files', icon: Upload, label: 'Files' },
  ],
  developer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'My Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'My Tasks' },
    { to: '/files', icon: Upload, label: 'Files' },
  ],
  client: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/project-requests', icon: FilePlus2, label: 'Project Requests' },
    { to: '/projects', icon: FolderKanban, label: 'My Projects' },
    { to: '/invoices', icon: CreditCard, label: 'Invoices' },
    { to: '/files', icon: Upload, label: 'Documents' },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, handleLogout } = useAuth();
  const items = navItems[user?.role] || [];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          flex flex-col z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <Logo size={40} showText />
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <NavLink to="/profile" className="sidebar-link" onClick={onClose}>
            <Settings className="h-5 w-5" />
            <span className="text-sm">Settings</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            type="button"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;