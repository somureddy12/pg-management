import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'CLEANLINESS', 'FOOD', 'SECURITY', 'OTHER'];
const STATUS_COLORS = { OPEN: 'badge-red', ACKNOWLEDGED: 'badge-yellow', IN_PROGRESS: 'badge-blue', RESOLVED: 'badge-green' };
const STATUS_STEPS = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];

export default function TenantComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [pgId, setPgId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'PLUMBING', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/tenants/me').then(r => {
      const id = r.data?.bed?.room?.floor?.pg?.id;
      const rId = r.data?.bed?.room?.id;
      setPgId(id); setRoomId(rId);
      if (id) api.get(`/communications/complaints/${id}`).then(r2 => {
        setComplaints(r2.data.filter(c => c.tenantId === user.id));
      });
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/communications/complaints', { roomId, ...form });
      toast.success('Complaint submitted!'); setShowForm(false);
      api.get(`/communications/complaints/${pgId}`).then(r => setComplaints(r.data.filter(c => c.tenantId === user.id)));
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Help & Complaints</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ New Complaint</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Submit a Complaint</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit Complaint'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {complaints.length === 0 && <div className="empty-state"><p>No complaints submitted yet.</p></div>}
        {complaints.map(c => (
          <div key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                <span className="badge badge-gray">{c.category}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 12 }}>{c.description}</p>
            {/* Progress tracker */}
            <div style={{ display: 'flex', gap: 0 }}>
              {STATUS_STEPS.map((step, i) => {
                const current = STATUS_STEPS.indexOf(c.status);
                const done = i <= current;
                return (
                  <div key={step} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? 'var(--primary)' : 'var(--gray-200)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
                      {done && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 10, color: done ? 'var(--primary)' : 'var(--gray-400)', marginTop: 4 }}>{step.replace('_', ' ')}</div>
                    {i < STATUS_STEPS.length - 1 && <div style={{ position: 'absolute', top: 10, left: '50%', width: '100%', height: 2, background: i < current ? 'var(--primary)' : 'var(--gray-200)', zIndex: 0 }} />}
                  </div>
                );
              })}
            </div>
            {c.resolution && <div style={{ marginTop: 12, padding: 10, background: 'var(--success-light)', borderRadius: 8, fontSize: 13, color: '#065f46' }}>✅ Resolution: {c.resolution}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
