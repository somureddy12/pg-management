import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function RentManagement() {
  const [pg, setPg] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    api.get('/owner/pg').then(r => { setPg(r.data); if (r.data?.id) loadBills(r.data.id, month, year); });
  }, []);

  const loadBills = (pgId, m, y) => {
    setLoading(true);
    api.get(`/rent/month/${m}/${y}?pgId=${pgId}`).then(r => setBills(r.data))
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };

  const generate = async () => {
    if (!pg) return;
    setGenerating(true);
    try {
      const r = await api.post('/rent/generate', { pgId: pg.id, month, year });
      toast.success(`Generated ${r.data.generated} rent bills`);
      loadBills(pg.id, month, year);
    } catch { toast.error('Generation failed'); } finally { setGenerating(false); }
  };

  const downloadReceipt = (billId) => {
    window.open(`http://localhost:8080/api/rent/receipt/${billId}`, '_blank');
  };

  const totalCollected = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalPending = bills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
  const paidCount = bills.filter(b => b.status === 'PAID').length;
  const unpaidCount = bills.filter(b => b.status === 'UNPAID').length;
  const partialCount = bills.filter(b => b.status === 'PARTIAL').length;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Rent Management</h1></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select className="form-select" style={{ width: 100 }} value={month} onChange={e => { setMonth(+e.target.value); if (pg) loadBills(pg.id, +e.target.value, year); }}>
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={year} onChange={e => { setYear(+e.target.value); if (pg) loadBills(pg.id, month, +e.target.value); }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? 'Generating...' : '⚡ Auto-Generate Bills'}
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div><div><div className="stat-value">{paidCount}</div><div className="stat-label">Paid</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--danger-light)' }}>❌</div><div><div className="stat-value">{unpaidCount}</div><div className="stat-label">Unpaid</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⚠️</div><div><div className="stat-value">{partialCount}</div><div className="stat-label">Partial</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-light)' }}>💰</div><div><div className="stat-value">₹{(totalCollected/1000).toFixed(1)}k</div><div className="stat-label">Collected</div></div></div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> : bills.length === 0 ? (
          <div className="empty-state"><p>No bills for this month. Click "Auto-Generate Bills" to create them.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Tenant</th><th>Room</th><th>Rent</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.id}>
                    <td><div style={{ fontWeight: 600 }}>{b.tenant?.name}</div><div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{b.tenant?.phone}</div></td>
                    <td style={{ fontSize: 13 }}>Room {b.tenant?.bed?.room?.roomNumber}, Bed {b.tenant?.bed?.bedLabel}</td>
                    <td>₹{b.totalAmount?.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>₹{b.paidAmount?.toLocaleString()}</td>
                    <td style={{ color: b.totalAmount - b.paidAmount > 0 ? 'var(--danger)' : 'var(--gray-500)' }}>
                      ₹{(b.totalAmount - b.paidAmount).toLocaleString()}
                    </td>
                    <td><span className={`badge ${b.status === 'PAID' ? 'badge-green' : b.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>{b.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {b.status !== 'PAID' && <button className="btn btn-success btn-sm" onClick={() => setPayModal(b)}>Pay</button>}
                      {b.status === 'PAID' && <button className="btn btn-outline btn-sm" onClick={() => downloadReceipt(b.id)}>🧾 Receipt</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payModal && <PayModal bill={payModal} onClose={() => setPayModal(null)} onSaved={() => { setPayModal(null); if (pg) loadBills(pg.id, month, year); }} />}
    </div>
  );
}

function PayModal({ bill, onClose, onSaved }) {
  const [form, setForm] = useState({ amount: bill.totalAmount - bill.paidAmount, mode: 'CASH', reference: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/rent/pay', { rentBillId: bill.id, amount: parseFloat(form.amount), mode: form.mode, reference: form.reference, notes: form.notes });
      toast.success('Payment recorded!'); onSaved();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">Record Payment — {bill.tenant?.name}</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Bill</span><span>₹{bill.totalAmount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid So Far</span><span>₹{bill.paidAmount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 8 }}><span>Balance</span><span>₹{bill.totalAmount - bill.paidAmount}</span></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Payment Mode</label>
                <select className="form-select" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                  <option value="CASH">Cash</option><option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option><option value="ONLINE">Online</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Reference / UTR</label><input className="form-input" placeholder="Optional" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-success" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</button></div>
        </form>
      </div>
    </div>
  );
}
