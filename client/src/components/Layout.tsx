import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/campaigns', label: 'Kampagnen', icon: '📣' },
  { to: '/keyword-planner', label: 'Keyword-Planer', icon: '🔑' },
  { to: '/reports', label: 'Berichte', icon: '📋' },
  { to: '/admin', label: 'Admin', icon: '👥', adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-google-gray-bg font-google">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-google-gray-light z-20 flex items-center px-4 gap-4">
        <div className="w-[230px] flex items-center gap-2 border-r border-google-gray-light pr-4 h-full">
          <span className="text-google-blue font-medium text-lg">SEA-AdArena</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-google-gray">
          <button className="text-xl hover:text-google-gray-dark" title="Hilfe">?</button>
          <button className="text-xl hover:text-google-gray-dark" title="Einstellungen">⚙</button>
          <span className="text-sm text-google-gray-dark">{user?.username}</span>
        </div>
      </header>

      {/* Sidebar */}
      <nav className="fixed top-16 left-0 w-[230px] h-[calc(100vh-64px)] bg-white border-r border-google-gray-light flex flex-col z-10">
        <div className="flex-1 py-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 h-10 px-4 mr-2 rounded-r-full text-sm transition-colors
                ${isActive
                  ? 'bg-google-blue-light text-google-blue font-medium'
                  : 'text-google-gray-dark hover:bg-google-gray-bg'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="border-t border-google-gray-light p-4 flex items-center justify-between">
          <span className="text-sm text-google-gray truncate">👤 {user?.username}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-google-blue hover:underline ml-2 whitespace-nowrap"
          >
            Abmelden
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ml-[230px] mt-16 p-6 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}
