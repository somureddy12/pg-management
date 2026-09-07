import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const navItems = [
  { path: '/owner', label: 'Dashboard', icon: '📊', end: true },
  { path: '/owner/floors', label: 'Floors & Rooms', icon: '🏗️' },
  { path: '/owner/tenants', label: 'Tenants', icon: '👥' },
  { path: '/owner/day-wise', label: 'Day Wise', icon: '📅' },
  { path: '/owner/rent', label: 'Rent', icon: '💰' },
  { path: '/owner/meals', label: 'Meals', icon: '🍱' },
  { path: '/owner/communications', label: 'Communications', icon: '📢' },
  { path: '/owner/expenses', label: 'Expenses', icon: '🧾' },
  { path: '/owner/reports', label: 'Reports', icon: '📈' },
  { path: '/owner/profile', label: 'Profile', icon: '👤' },
];

export default function OwnerLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pg, setPg] = useState(null);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    api.get('/owner/pg').then(r => setPg(r.data)).catch(() => {});
  }, []);

  return (
    <div className="layout">
      {/* Hamburger — only visible on mobile */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Overlay backdrop */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
          {pg ? (
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              <strong style={{ display: 'block', marginBottom: 2 }}>{pg.name}</strong>
              <span style={{ color: 'var(--gray-400)', fontSize: 12, lineHeight: 1.4, display: 'block' }}>{pg.address}</span>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{user?.name}</div>
          )}
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
