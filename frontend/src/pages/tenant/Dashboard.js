import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const today = new Date().toISOString().split('T')[0];

function isAdvanceReturnable(vacateRequestDate, vacateDate) {
  if (!vacateRequestDate || !vacateDate) return false;
  const req = new Date(vacateRequestDate);
  const vac = new Date(vacateDate);
  const diff = (vac - req) / (1000 * 60 * 60 * 24);
  return diff >= 30;
}

export default function TenantDashboard() {
  const [tenant, setTenant] = useState(null);
  const [todayMenu, setTodayMenu] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vacate modal state
  const [showVacateModal, setShowVacateModal] = useState(false);
  const [vacateForm, setVacateForm] = useState({ vacateType: 'CONFIRMED', vacateDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadProfile = () =>
    api.get('/tenants/me').then(r => {
      setTenant(r.data);
      const pgId = r.data?.pgId;
      if (pgId) {
        const d = new Date().toISOString().split('T')[0];
        api.get(`/meals/my?date=${d}`).then(m => setTodayMenu(m.data));
        api.get(`/communications/notices/${pgId}`).then(n => setNotices(n.data.slice(0, 3)));
      }
    }).finally(() => setLoading(false));

  useEffect(() => { loadProfile(); }, []);

  const openVacateModal = (edit = false) => {
    setIsEditing(edit);
    if (edit && tenant) {
      setVacateForm({
        vacateType: tenant.vacateType || 'CONFIRMED',
        vacateDate: tenant.expectedVacate || '',
        reason: tenant.vacateReason || '',
      });
    } else {
      setVacateForm({ vacateType: 'CONFIRMED', vacateDate: '', reason: '' });
    }
    setShowVacateModal(true);
  };

  const handleVacateSubmit = async (e) => {
    e.preventDefault();
    if (!vacateForm.vacateDate || !vacateForm.reason.trim()) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        vacateDate: vacateForm.vacateDate,
        vacateType: vacateForm.vacateType,
        reason: vacateForm.reason.trim(),
      };
      if (isEditing) {
        await api.put('/tenants/me/vacate-request', payload);
        toast.success('Vacate request updated!');
      } else {
        await api.post('/tenants/me/vacate-request', payload);
        toast.success('Vacate request submitted!');
      }
      setShowVacateModal(false);
      loadProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  const handleCancelRequest = async () => {
    if (!window.confirm('Are you sure you want to cancel your vacate request?')) return;
    try {
      await api.delete('/tenants/me/vacate-request');
      toast.success('Vacate request cancelled');
      loadProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to cancel request');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!tenant) return <div>Profile not found. Contact your PG owner.</div>;

  const latestBill = tenant.rentBills?.[0];
  const isOnNotice = tenant.status === 'NOTICE_PERIOD';
  const advanceReturnable = isAdvanceReturnable(tenant.vacateRequestDate, tenant.expectedVacate);

  const MEAL_ICONS = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {tenant.name} 👋</h1>
          <p className="page-subtitle">{tenant.pgName}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isOnNotice ? (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => openVacateModal(true)}>✏️ Edit Vacate Request</button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleCancelRequest}>✕ Cancel Request</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => openVacateModal(false)}>🚪 Vacate</button>
          )}
        </div>
      </div>

      {/* Notice period banner */}
      {isOnNotice && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>
              {tenant.vacateType === 'TENTATIVE' ? '📅 Tentative Vacate Notice' : '🚪 Vacate Notice Submitted'}
            </div>
            <div style={{ fontSize: 13, color: '#78350f', marginTop: 3 }}>
              Planned vacate: <strong>{new Date(tenant.expectedVacate).toLocaleDateString('en-IN')}</strong>
              &nbsp;·&nbsp;Reason: {tenant.vacateReason}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, color: advanceReturnable ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
              {advanceReturnable
                ? '✅ Advance (₹' + tenant.securityDeposit?.toLocaleString() + ') eligible for return — 30+ days notice given'
                : '⚠️ Advance may NOT be returned — less than 30 days notice given'}
            </div>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>🏠</div>
          <div>
            <div className="stat-value">Room {tenant.roomNumber}</div>
            <div className="stat-label">Floor {tenant.floorNumber} · Bed {tenant.bedLabel}</div>
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
            <Link to="/tenant/meals" style={{ fontSize: 13, color: 'var(--primary)' }}>Full week →</Link>
          </div>
          {todayMenu.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No menu set for today.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todayMenu.map(post => (
                <div key={post.id} style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 6, fontWeight: 600 }}>{MEAL_ICONS[post.mealType]} {post.mealType}</div>
                  {post.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <span>{item.itemName}</span>
                      <span>{item.isVeg ? '🟢' : '🔴'}</span>
                    </div>
                  ))}
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

      {/* Vacate Modal */}
      {showVacateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div className="card" style={{ width: 520, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="card-title" style={{ marginBottom: 4 }}>
              {isEditing ? '✏️ Edit Vacate Request' : '🚪 Submit Vacate Request'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
              All fields are required. Please fill in accurate information.
            </p>

            {/* Info row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: 'var(--gray-50)', borderRadius: 8, padding: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Tenant Name</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{tenant.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Room / Bed</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>Room {tenant.roomNumber} · Bed {tenant.bedLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Security Deposit (Advance)</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', marginTop: 3 }}>₹{tenant.securityDeposit?.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', textTransform: 'uppercase', fontWeight: 600 }}>Join Date</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{new Date(tenant.joinDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            {/* Advance return notice */}
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
              <strong>Note:</strong> To get your security deposit (advance) back, you must inform the owner <strong>at least 1 month before</strong> your vacate date. Requests given with less than 30 days notice are not eligible for advance refund.
            </div>

            <form onSubmit={handleVacateSubmit}>
              {/* Vacate Type */}
              <div className="form-group">
                <label className="form-label">Vacate Type *</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  {[
                    { value: 'CONFIRMED', label: 'Confirmed', desc: 'I am sure about this date' },
                    { value: 'TENTATIVE', label: 'Tentative', desc: 'Date may change' },
                  ].map(opt => (
                    <label key={opt.value} style={{
                      flex: 1, cursor: 'pointer', border: `2px solid ${vacateForm.vacateType === opt.value ? '#7c3aed' : 'var(--gray-200)'}`,
                      borderRadius: 8, padding: '10px 14px', background: vacateForm.vacateType === opt.value ? '#ede9fe' : '#fff',
                    }}>
                      <input type="radio" name="vacateType" value={opt.value}
                        checked={vacateForm.vacateType === opt.value}
                        onChange={() => setVacateForm(f => ({ ...f, vacateType: opt.value }))}
                        style={{ marginRight: 8 }} />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Vacate Date */}
              <div className="form-group">
                <label className="form-label">
                  {vacateForm.vacateType === 'TENTATIVE' ? 'Tentative Vacate Date *' : 'Vacate Date *'}
                </label>
                <input
                  className="form-input"
                  type="date"
                  min={today}
                  value={vacateForm.vacateDate}
                  onChange={e => setVacateForm(f => ({ ...f, vacateDate: e.target.value }))}
                  required
                />
                {vacateForm.vacateDate && (() => {
                  const days = Math.floor((new Date(vacateForm.vacateDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div style={{ fontSize: 12, marginTop: 5, color: days >= 30 ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                      {days >= 30
                        ? `✅ ${days} days from today — advance eligible for return`
                        : `⚠️ Only ${days} days from today — advance will NOT be returned`}
                    </div>
                  );
                })()}
              </div>

              {/* Reason */}
              <div className="form-group">
                <label className="form-label">Reason for Vacating *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Shifting to own house, job change, relocation..."
                  value={vacateForm.reason}
                  onChange={e => setVacateForm(f => ({ ...f, reason: e.target.value }))}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowVacateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : isEditing ? 'Update Request' : 'Submit Vacate Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
