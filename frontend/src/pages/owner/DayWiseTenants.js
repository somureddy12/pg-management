import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SHARING_LABEL = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Quadruple' };
const STATUS_COLORS = { UPCOMING: 'badge-yellow', ACTIVE: 'badge-green', COMPLETED: 'badge-gray', CANCELLED: 'badge-red' };

const BLANK_FORM = {
  name: '', phone: '', email: '', emergencyContact: '',
  idType: 'AADHAAR', idNumber: '', notes: '',
  startDate: '', endDate: '', pricePerDay: '', paidAmount: '0',
  selectedFloor: '', selectedRoom: '', bedId: '',
};

export default function DayWiseTenants() {
  const [pg, setPg] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) loadGuests(r.data.id);
    }).catch(() => setLoading(false));
  }, []);

  const loadGuests = (pgId) => {
    setLoading(true);
    api.get(`/day-wise?pgId=${pgId}`).then(r => setGuests(r.data))
      .catch(() => toast.error('Failed to load guests'))
      .finally(() => setLoading(false));
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const floors = pg?.floors || [];
  const rooms = floors.find(f => f.id === form.selectedFloor)?.rooms || [];
  const selectedRoom = rooms.find(r => r.id === form.selectedRoom);
  const beds = selectedRoom?.beds || [];

  const totalDays = form.startDate && form.endDate
    ? Math.max(0, Math.floor((new Date(form.endDate) - new Date(form.startDate)) / 86400000))
    : 0;
  const totalAmount = totalDays > 0 && form.pricePerDay ? (totalDays * parseFloat(form.pricePerDay || 0)).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bedId) return toast.error('Please select a bed');
    if (totalDays <= 0) return toast.error('End date must be after start date');
    setSaving(true);
    try {
      await api.post('/day-wise', {
        ...form,
        pricePerDay: parseFloat(form.pricePerDay),
        paidAmount: parseFloat(form.paidAmount || 0),
      });
      toast.success('Day-wise guest added!');
      setShowForm(false);
      setForm(BLANK_FORM);
      loadGuests(pg.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add guest');
    } finally { setSaving(false); }
  };

  const handleCheckout = async (id) => {
    try {
      await api.put(`/day-wise/${id}/checkout`);
      toast.success('Checked out');
      loadGuests(pg.id);
    } catch { toast.error('Failed'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/day-wise/${id}/cancel`);
      toast.success('Booking cancelled');
      loadGuests(pg.id);
    } catch { toast.error('Failed'); }
  };

  const handlePayment = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return toast.error('Enter a valid amount');
    try {
      await api.put(`/day-wise/${payModal.id}/payment`, { amount: parseFloat(payAmount) });
      toast.success('Payment recorded');
      setPayModal(null);
      setPayAmount('');
      loadGuests(pg.id);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = statusFilter ? guests.filter(g => g.status === statusFilter) : guests;

  const activeCount   = guests.filter(g => g.status === 'ACTIVE').length;
  const upcomingCount = guests.filter(g => g.status === 'UPCOMING').length;
  const todayCheckouts = guests.filter(g => {
    const today = new Date().toISOString().split('T')[0];
    return (g.status === 'ACTIVE' || g.status === 'UPCOMING') && g.endDate === today;
  }).length;
  const monthRevenue = guests
    .filter(g => {
      const m = new Date().getMonth() + 1;
      const y = new Date().getFullYear();
      const d = new Date(g.startDate);
      return d.getMonth() + 1 === m && d.getFullYear() === y;
    })
    .reduce((s, g) => s + (g.paidAmount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Day Wise Guests</h1>
          <p className="page-subtitle">Manage short-stay / daily guests</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setForm(BLANK_FORM); }}>
          + Add Guest
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)' }}>🟢</div>
          <div><div className="stat-value">{activeCount}</div><div className="stat-label">Active Guests</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>📅</div>
          <div><div className="stat-value">{upcomingCount}</div><div className="stat-label">Upcoming</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>🚪</div>
          <div><div className="stat-value">{todayCheckouts}</div><div className="stat-label">Today's Checkouts</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-light)' }}>💰</div>
          <div><div className="stat-value">₹{(monthRevenue / 1000).toFixed(1)}k</div><div className="stat-label">This Month Revenue</div></div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="card" style={{ width: '100%', maxWidth: 860, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Add Day-Wise Guest</h3>
            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>✕</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

              {/* Personal Details */}
              <div>
                <h4 style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>👤 Personal Details</h4>
                <div className="form-group"><label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Phone *</label>
                  <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Emergency Contact</label>
                  <input className="form-input" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group"><label className="form-label">ID Type</label>
                    <select className="form-select" value={form.idType} onChange={e => set('idType', e.target.value)}>
                      <option value="AADHAAR">Aadhaar</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="VOTER_ID">Voter ID</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">ID Number</label>
                    <input className="form-input" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
              </div>

              {/* Bed Assignment */}
              <div>
                <h4 style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>🛏️ Room & Bed</h4>
                <div className="form-group"><label className="form-label">Floor *</label>
                  <select className="form-select" value={form.selectedFloor}
                    onChange={e => set('selectedFloor', e.target.value)} required>
                    <option value="">Select floor</option>
                    {floors.map(f => <option key={f.id} value={f.id}>Floor {f.number}{f.label ? ` — ${f.label}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Room *</label>
                  <select className="form-select" value={form.selectedRoom}
                    onChange={e => set('selectedRoom', e.target.value)} disabled={!form.selectedFloor} required>
                    <option value="">Select room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber} ({SHARING_LABEL[r.sharingType] || r.sharingType + '-Sharing'})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Bed *</label>
                  <select className="form-select" value={form.bedId}
                    onChange={e => set('bedId', e.target.value)} disabled={!form.selectedRoom} required>
                    <option value="">Select bed</option>
                    {beds.map(b => <option key={b.id} value={b.id}>Bed {b.bedLabel} ({b.status})</option>)}
                  </select>
                </div>
                {selectedRoom && (
                  <div style={{ padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 13, color: 'var(--gray-600)' }}>
                    Room {selectedRoom.roomNumber} · {SHARING_LABEL[selectedRoom.sharingType] || selectedRoom.sharingType + '-Sharing'}
                  </div>
                )}
              </div>

              {/* Stay & Pricing */}
              <div>
                <h4 style={{ marginBottom: 10, fontSize: 14, fontWeight: 600 }}>💰 Stay & Pricing</h4>
                <div className="form-group"><label className="form-label">Start Date *</label>
                  <input className="form-input" type="date" value={form.startDate}
                    onChange={e => set('startDate', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">End Date *</label>
                  <input className="form-input" type="date" value={form.endDate}
                    onChange={e => set('endDate', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Price Per Day (₹) *</label>
                  <input className="form-input" type="number" min="1" value={form.pricePerDay}
                    onChange={e => set('pricePerDay', e.target.value)} required /></div>
                <div className="form-group"><label className="form-label">Amount Paid (₹)</label>
                  <input className="form-input" type="number" min="0" value={form.paidAmount}
                    onChange={e => set('paidAmount', e.target.value)} /></div>

                {totalDays > 0 && (
                  <div style={{ padding: 12, background: 'var(--primary-light)', borderRadius: 8, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--gray-600)' }}>Duration</span>
                      <span style={{ fontWeight: 700 }}>{totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-600)' }}>Total Amount</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 16 }}>₹{totalAmount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'var(--gray-600)' }}>Balance</span>
                      <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        ₹{(parseFloat(totalAmount) - parseFloat(form.paidAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Guest'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        {['ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(s)}>
            {s}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gray-500)' }}>{filtered.length} guests</span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No day-wise guests found. Click "+ Add Guest" to add one.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room / Bed</th>
                  <th>Stay</th>
                  <th>Duration</th>
                  <th>Rate / Day</th>
                  <th>Total (₹)</th>
                  <th>Paid (₹)</th>
                  <th>Balance (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => {
                  const today = new Date().toISOString().split('T')[0];
                  const isCheckoutToday = g.endDate === today && (g.status === 'ACTIVE' || g.status === 'UPCOMING');
                  return (
                    <tr key={g.id} style={{ background: isCheckoutToday ? 'rgba(239,68,68,0.04)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{g.phone}</div>
                        {g.idType && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{g.idType}: {g.idNumber}</div>}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <div>Room {g.roomNumber}, Bed {g.bedLabel}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{SHARING_LABEL[g.sharingType] || g.sharingType + '-Sharing'} · Floor {g.floorNumber}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        <div>{new Date(g.startDate).toLocaleDateString('en-IN')}</div>
                        <div style={{ color: 'var(--gray-500)' }}>to {new Date(g.endDate).toLocaleDateString('en-IN')}</div>
                        {isCheckoutToday && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600 }}>Checkout Today!</div>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{g.totalDays} day{g.totalDays !== 1 ? 's' : ''}</td>
                      <td>₹{parseFloat(g.pricePerDay).toLocaleString()}</td>
                      <td style={{ fontWeight: 600 }}>₹{parseFloat(g.totalAmount).toLocaleString()}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{parseFloat(g.paidAmount).toLocaleString()}</td>
                      <td style={{ color: parseFloat(g.balanceAmount) > 0 ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 600 }}>
                        ₹{parseFloat(g.balanceAmount).toLocaleString()}
                      </td>
                      <td><span className={`badge ${STATUS_COLORS[g.status]}`}>{g.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(g.status === 'ACTIVE' || g.status === 'UPCOMING') && (
                            <>
                              {parseFloat(g.balanceAmount) > 0 && (
                                <button className="btn btn-outline btn-sm"
                                  onClick={() => { setPayModal(g); setPayAmount(parseFloat(g.balanceAmount).toFixed(2)); }}>
                                  💵 Pay
                                </button>
                              )}
                              <button className="btn btn-outline btn-sm" onClick={() => handleCheckout(g.id)}>
                                🚪 Checkout
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(g.id)}>
                                ✕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 380, padding: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Record Payment — {payModal.name}</h3>
            <div style={{ marginBottom: 12, fontSize: 14, color: 'var(--gray-600)' }}>
              Balance: <strong style={{ color: 'var(--danger)' }}>₹{parseFloat(payModal.balanceAmount).toLocaleString()}</strong>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" min="1" max={payModal.balanceAmount}
                value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePayment}>Record Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
