import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AddTenant() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBedId = searchParams.get('bedId');

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', emergencyContact: '',
    idType: 'AADHAAR', idNumber: '', joinDate: new Date().toISOString().split('T')[0],
    expectedVacate: '', monthlyRent: '', securityDeposit: '',
    bedId: preselectedBedId || '',
    selectedFloor: '', selectedRoom: ''
  });

  useEffect(() => {
    api.get('/owner/pg').then(r => setPg(r.data));
  }, []);

  const floors = pg?.floors || [];
  const rooms = floors.find(f => f.id === form.selectedFloor)?.rooms || [];
  const beds = rooms.find(r => r.id === form.selectedRoom)?.beds?.filter(b => b.status === 'VACANT') || [];

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bedId) return toast.error('Please select a bed');
    setLoading(true);
    try {
      await api.post('/tenants', {
        bedId: form.bedId, name: form.name, phone: form.phone, email: form.email,
        emergencyContact: form.emergencyContact, idType: form.idType, idNumber: form.idNumber,
        joinDate: form.joinDate, expectedVacate: form.expectedVacate || undefined,
        monthlyRent: parseFloat(form.monthlyRent), securityDeposit: parseFloat(form.securityDeposit) || 0,
      });
      toast.success('Tenant added successfully!');
      navigate('/owner/tenants');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add tenant');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Tenant</h1>
          <p className="page-subtitle">Fill in tenant details and assign a bed</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Personal Details */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>👤 Personal Details</h3>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Emergency Contact</label><input className="form-input" placeholder="Name — Phone" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} /></div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">ID Type *</label>
                <select className="form-select" value={form.idType} onChange={e => set('idType', e.target.value)}>
                  <option value="AADHAAR">Aadhaar</option><option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option><option value="VOTER_ID">Voter ID</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">ID Number *</label><input className="form-input" value={form.idNumber} onChange={e => set('idNumber', e.target.value)} required /></div>
            </div>
          </div>

          {/* Bed Assignment */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>🛏️ Bed Assignment</h3>
            {preselectedBedId ? (
              <div style={{ padding: 12, background: 'var(--success-light)', borderRadius: 8, marginBottom: 16, color: '#065f46', fontSize: 14 }}>
                ✅ Bed pre-selected from room view
              </div>
            ) : (
              <>
                <div className="form-group"><label className="form-label">Floor</label>
                  <select className="form-select" value={form.selectedFloor} onChange={e => set('selectedFloor', e.target.value)}>
                    <option value="">Select floor</option>
                    {floors.map(f => <option key={f.id} value={f.id}>Floor {f.number}{f.label ? ` — ${f.label}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Room</label>
                  <select className="form-select" value={form.selectedRoom} onChange={e => set('selectedRoom', e.target.value)} disabled={!form.selectedFloor}>
                    <option value="">Select room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Bed (Vacant only)</label>
                  <select className="form-select" value={form.bedId} onChange={e => set('bedId', e.target.value)} disabled={!form.selectedRoom}>
                    <option value="">Select bed</option>
                    {beds.map(b => <option key={b.id} value={b.id}>Bed {b.bedLabel}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Join Date *</label><input className="form-input" type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Expected Vacate</label><input className="form-input" type="date" value={form.expectedVacate} onChange={e => set('expectedVacate', e.target.value)} /></div>
            </div>
          </div>

          {/* Financial */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>💰 Financial Details</h3>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Monthly Rent (₹) *</label><input className="form-input" type="number" value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)} required /></div>
              <div className="form-group"><label className="form-label">Security Deposit (₹)</label><input className="form-input" type="number" value={form.securityDeposit} onChange={e => set('securityDeposit', e.target.value)} /></div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Tenant'}</button>
        </div>
      </form>
    </div>
  );
}
