import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/owner', label: 'Dashboard', icon: '📊', end: true },
  { path: '/owner/floors', label: 'Floors & Rooms', icon: '🏗️' },
  { path: '/owner/tenants', label: 'Tenants', icon: '👥' },
  { path: '/owner/rent', label: 'Rent', icon: '💰' },
  { path: '/owner/meals', label: 'Meals', icon: '🍱' },
  { path: '/owner/communications', label: 'Communications', icon: '📢' },
  { path: '/owner/expenses', label: 'Expenses', icon: '🧾' },
  { path: '/owner/reports', label: 'Reports', icon: '📈' },
];

export default function OwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🏠 PG Manager</h2>
          <p>Owner Portal</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 10 }}>
            <strong>{user?.name}</strong><br />
            <span style={{ color: 'var(--gray-400)' }}>{user?.email}</span>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
