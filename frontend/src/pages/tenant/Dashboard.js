import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export default function TenantDashboard() {
  const [tenant, setTenant] = useState(null);
  const [todayMenu, setTodayMenu] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants/me').then(r => {
      setTenant(r.data);
      const pgId = r.data?.bed?.room?.floor?.pg?.id;
      if (pgId) {
        api.get(`/menu/today/${pgId}`).then(m => setTodayMenu(m.data));
        api.get(`/communications/notices/${pgId}`).then(n => setNotices(n.data.slice(0, 3)));
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!tenant) return <div>Profile not found. Contact your PG owner.</div>;

  const latestBill = tenant.rentBills?.[0];
  const room = tenant.bed?.room;
  const floor = room?.floor;
  const pg = floor?.pg;

  const MEAL_ICONS = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {tenant.name} 👋</h1>
          <p className="page-subtitle">{pg?.name} · {pg?.address}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🏠</div>
          <div>
            <div className="stat-value">Room {room?.roomNumber}</div>
            <div className="stat-label">Floor {floor?.number} · Bed {tenant.bed?.bedLabel}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>💰</div>
          <div>
            <div className="stat-value">₹{tenant.monthlyRent?.toLocaleString()}</div>
            <div className="stat-label">Monthly Rent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: latestBill?.status === 'PAID' ? 'var(--success-light)' : 'var(--danger-light)' }}>
            {latestBill?.status === 'PAID' ? '✅' : '⚠️'}
          </div>
          <div>
            <div className="stat-value">{latestBill?.status || 'No bill'}</div>
            <div className="stat-label">This Month's Rent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>📅</div>
          <div>
            <div className="stat-value">{new Date(tenant.joinDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="stat-label">Join Date</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Rent status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Rent Status</h3>
            <Link to="/tenant/rent" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {latestBill ? (
            <div className="rent-bill">
              <div className="rent-row"><span>Room Rent</span><span>₹{latestBill.roomRent}</span></div>
              {latestBill.messCharges > 0 && <div className="rent-row"><span>Mess Charges</span><span>₹{latestBill.messCharges}</span></div>}
              {latestBill.lateFee > 0 && <div className="rent-row"><span>Late Fee</span><span style={{ color: 'var(--danger)' }}>₹{latestBill.lateFee}</span></div>}
              <div className="rent-row"><span>Total</span><span>₹{latestBill.totalAmount}</span></div>
              <div className="rent-row"><span>Paid</span><span style={{ color: 'var(--success)' }}>₹{latestBill.paidAmount}</span></div>
              <div style={{ marginTop: 12 }}>
                <span className={`badge ${latestBill.status === 'PAID' ? 'badge-green' : latestBill.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                  {latestBill.status}
                </span>
              </div>
            </div>
          ) : <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No bill generated yet.</p>}
        </div>

        {/* Today's menu */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Today's Menu</h3>
            <Link to="/tenant/menu" style={{ fontSize: 13, color: 'var(--primary)' }}>Full week →</Link>
          </div>
          {todayMenu.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No menu set for today.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayMenu.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 2 }}>{MEAL_ICONS[item.mealType]} {item.mealType}</div>
                    <div style={{ fontSize: 14 }}>{item.items}</div>
                  </div>
                  <span style={{ fontSize: 12 }}>{item.isVeg ? '🟢' : '🔴'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest notices */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <h3 className="card-title">Latest Notices</h3>
            <Link to="/tenant/notices" style={{ fontSize: 13, color: 'var(--primary)' }}>View all →</Link>
          </div>
          {notices.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No notices.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notices.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 8, borderLeft: n.isPinned ? '3px solid var(--primary)' : undefined }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{n.isPinned ? '📌 ' : ''}{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{n.body}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>{new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
