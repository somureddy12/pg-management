import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/dashboard').then(r => setData(r.data)).catch(e => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  if (!data?.hasPg) return (
    <div>
      <div className="page-header"><h1 className="page-title">Welcome to PG Manager</h1></div>
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏠</div>
        <h2 style={{ marginBottom: 8 }}>Set Up Your PG</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Create your PG listing to start managing tenants and rooms.</p>
        <SetupPgForm onCreated={() => window.location.reload()} />
      </div>
    </div>
  );

  const { stats, rent, upcomingVacancies } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{data.pg?.name}</h1>
          <p className="page-subtitle">{data.pg?.address}</p>
        </div>
        <Link to="/owner/tenants/add" className="btn btn-primary">+ Add Tenant</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🛏️</div>
          <div><div className="stat-value">{stats.totalBeds}</div><div className="stat-label">Total Beds</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>👤</div>
          <div><div className="stat-value">{stats.occupiedBeds}</div><div className="stat-label">Occupied</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div>
          <div><div className="stat-value">{stats.vacantBeds}</div><div className="stat-label">Vacant</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--advance-light)' }}>📅</div>
          <div><div className="stat-value">{stats.advanceBeds}</div><div className="stat-label">Advance Booked</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>💰</div>
          <div><div className="stat-value">₹{(rent.collectedRent/1000).toFixed(1)}k</div><div className="stat-label">Collected This Month</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏳</div>
          <div><div className="stat-value">₹{(rent.pendingRent/1000).toFixed(1)}k</div><div className="stat-label">Pending Rent</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Occupancy bar */}
        <div className="card">
          <div className="card-header"><h3 className="card-title">Occupancy Overview</h3></div>
          <OccupancyBar stats={stats} />
          <div className="legend" style={{ marginTop: 16 }}>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--danger)' }} />Occupied ({stats.occupiedBeds})</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--success)' }} />Vacant ({stats.vacantBeds})</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--advance)' }} />Advance ({stats.advanceBeds})</div>
          </div>
        </div>

        {/* Upcoming vacancies */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Vacancies</h3>
            <span className="badge badge-yellow">{upcomingVacancies.length} in 30 days</span>
          </div>
          {upcomingVacancies.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No upcoming vacancies</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {upcomingVacancies.slice(0, 5).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Room {t.bed.room.roomNumber}, Bed {t.bed.bedLabel}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>
                      {new Date(t.expectedVacate).toLocaleDateString('en-IN')}
                    </div>
                    <Link to={`/owner/rooms`} className="btn btn-outline btn-sm" style={{ marginTop: 4 }}>Book Bed</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OccupancyBar({ stats }) {
  const total = stats.totalBeds || 1;
  const occupiedPct = (stats.occupiedBeds / total) * 100;
  const advancePct = (stats.advanceBeds / total) * 100;
  const vacantPct = (stats.vacantBeds / total) * 100;
  return (
    <div>
      <div style={{ display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', gap: 2 }}>
        <div style={{ width: `${occupiedPct}%`, background: 'var(--danger)', transition: 'width 0.5s' }} />
        <div style={{ width: `${advancePct}%`, background: 'var(--advance)', transition: 'width 0.5s' }} />
        <div style={{ width: `${vacantPct}%`, background: 'var(--success)', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: 'var(--gray-500)' }}>
        <span>{Math.round(occupiedPct)}% occupied</span>
        <span>{stats.totalBeds} total beds</span>
      </div>
    </div>
  );
}

function SetupPgForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/owner/pg', form);
      toast.success('PG created!');
      onCreated();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
      <div className="form-group">
        <label className="form-label">PG Name</label>
        <input className="form-input" placeholder="e.g. Sunshine PG" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="form-group">
        <label className="form-label">Address</label>
        <input className="form-input" placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
      </div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create PG'}</button>
    </form>
  );
}
