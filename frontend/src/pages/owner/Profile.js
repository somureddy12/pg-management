import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function OwnerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    api.get('/owner/profile')
      .then(r => {
        setProfile(r.data);
        setForm({
          ownerName: r.data.ownerName,
          phone: r.data.phone,
          pgName: r.data.pgName || '',
          pgAddress: r.data.pgAddress || '',
          pgDescription: r.data.pgDescription || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/owner/profile', form);
      setProfile(res.data);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const initials = (profile?.ownerName || user?.name || 'O').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = profile?.memberSince ? new Date(profile.memberSince).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const occupancyPct = profile?.totalBeds > 0 ? Math.round((profile.occupiedBeds / profile.totalBeds) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account and PG details</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!editing && (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
          <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {editing ? (
        <EditForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={() => { setEditing(false); }}
          saving={saving}
          hasPg={!!profile?.pgId}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="stagger">

          {/* Owner card */}
          <div className="card card-hover animate-fade-in-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div
                className="avatar-pulse"
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12) rotate(5deg)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 800, color: '#fff', flexShrink: 0,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default',
                }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{profile?.ownerName}</div>
                <div style={{ fontSize: 14, color: 'var(--gray-500)', marginBottom: 2 }}>{profile?.email}</div>
                <div style={{ fontSize: 14, color: 'var(--gray-500)' }}>{profile?.phone}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--gray-400)' }}>
                <div>Member since</div>
                <div style={{ fontWeight: 600, color: 'var(--gray-600)' }}>{memberSince}</div>
              </div>
            </div>
          </div>

          {/* PG details */}
          {profile?.pgId ? (
            <div className="card card-hover animate-fade-in-up">
              <div className="card-header" style={{ marginBottom: 16 }}>
                <h3 className="card-title">PG Details</h3>
              </div>
              <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <InfoRow label="PG Name" value={profile.pgName} />
                <InfoRow label="Address" value={profile.pgAddress} />
                {profile.pgDescription && (
                  <InfoRow label="Description" value={profile.pgDescription} fullWidth />
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
              No PG registered yet. Go to the Dashboard to set up your PG.
            </div>
          )}

          {/* Stats grid */}
          {profile?.pgId && (
            <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Bed & room stats */}
              <div className="card card-hover">
                <div className="card-header" style={{ marginBottom: 16 }}>
                  <h3 className="card-title">Capacity & Occupancy</h3>
                  <span className="badge badge-green">{occupancyPct}% occupied</span>
                </div>

                {/* Occupancy bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--gray-100)', gap: 2 }}>
                    <div style={{ width: `${profile.totalBeds > 0 ? (profile.occupiedBeds / profile.totalBeds) * 100 : 0}%`, background: 'var(--danger)', transition: 'width 0.5s' }} />
                    <div style={{ width: `${profile.totalBeds > 0 ? (profile.advanceBeds / profile.totalBeds) * 100 : 0}%`, background: 'var(--advance)', transition: 'width 0.5s' }} />
                    <div style={{ width: `${profile.totalBeds > 0 ? (profile.vacantBeds / profile.totalBeds) * 100 : 0}%`, background: 'var(--success)', transition: 'width 0.5s' }} />
                  </div>
                </div>

                <div className="resp-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <StatPill label="Total Beds" value={profile.totalBeds} color="var(--primary)" />
                  <StatPill label="Occupied" value={profile.occupiedBeds} color="var(--danger)" />
                  <StatPill label="Vacant" value={profile.vacantBeds} color="var(--success)" />
                  <StatPill label="Advance Booked" value={profile.advanceBeds} color="var(--advance)" />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <div style={{ flex: 1, background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.totalFloors}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floors</div>
                  </div>
                  <div style={{ flex: 1, background: 'var(--gray-50)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{profile.totalRooms}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Rooms</div>
                  </div>
                </div>
              </div>

              {/* Tenant stats */}
              <div className="card card-hover">
                <div className="card-header" style={{ marginBottom: 16 }}>
                  <h3 className="card-title">Tenant Summary</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <TenantStatRow
                    label="Active Tenants"
                    value={profile.activeTenants}
                    color="#15803d"
                    bg="#dcfce7"
                    icon="✅"
                  />
                  <TenantStatRow
                    label="On Notice Period"
                    value={profile.noticePeriodTenants}
                    color="#b45309"
                    bg="#fef9c3"
                    icon="🚪"
                  />
                  <TenantStatRow
                    label="Total Active"
                    value={profile.activeTenants + profile.noticePeriodTenants}
                    color="var(--primary)"
                    bg="var(--primary-light)"
                    icon="👥"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, color: 'var(--gray-800)', lineHeight: 1.5 }}>{value || '—'}</div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      style={{
        background: 'var(--gray-50)', borderRadius: 8, padding: '10px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default',
      }}>
      <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function TenantStatRow({ label, value, color, bg, icon }) {
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', background: bg, borderRadius: 10,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease', cursor: 'default',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color }}>{label}</span>
      </div>
      <span style={{ fontSize: 22, fontWeight: 800, color }}>{value}</span>
    </div>
  );
}

function EditForm({ form, setForm, onSave, onCancel, saving, hasPg }) {
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  return (
    <form onSubmit={onSave}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Owner info */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Owner Information</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} required />
            </div>
          </div>
        </div>

        {/* PG info */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">PG Details</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">PG Name</label>
              <input className="form-input" value={form.pgName} onChange={e => set('pgName', e.target.value)} required={hasPg} />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.pgAddress} onChange={e => set('pgAddress', e.target.value)} required={hasPg} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(optional)</span></label>
              <textarea className="form-input" rows={3} value={form.pgDescription} onChange={e => set('pgDescription', e.target.value)} placeholder="Brief description of your PG..." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
