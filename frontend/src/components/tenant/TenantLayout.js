import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/tenant', label: 'My Room', icon: '🏠', end: true },
  { path: '/tenant/rent', label: 'Rent & Payments', icon: '💰' },
  { path: '/tenant/meals', label: 'Meals', icon: '🍱' },
  { path: '/tenant/complaints', label: 'Help & Complaints', icon: '🔧' },
  { path: '/tenant/notices', label: 'Notices', icon: '📢' },
];

export default function TenantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="layout">
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>🏠 PG Manager</h2>
          <p>Tenant Portal</p>
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
            <span style={{ color: 'var(--gray-400)' }}>{user?.phone}</span>
          </div>
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { logout(); navigate('/login'); }}>
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
