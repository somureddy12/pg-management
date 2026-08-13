import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
  return (
    <div className="layout">
      <aside className="sidebar">
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
          <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content"><div className="page-content"><Outlet /></div></main>
    </div>
  );
}
