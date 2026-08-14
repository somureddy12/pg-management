import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SHARING_LABEL = { 1: '1 - Single', 2: '2 - Double', 3: '3 - Triple', 4: '4 - Quadruple' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function downloadExcel(bills, month, year) {
  const monthLabel = MONTHS[month - 1];
  const headers = ['Name', 'Phone', 'Floor', 'Room', 'Bed', 'Sharing', 'Month', 'Year', 'Status', 'Payment Mode', 'Payment Date', 'Reference', 'Total (₹)', 'Paid (₹)', 'Balance (₹)'];

  const cellStyle = 'border:1px solid #999;padding:6px 10px;font-size:13px;';
  const headerStyle = `${cellStyle}background:#1e3a5f;color:#fff;font-weight:bold;`;
  const paidStyle = `${cellStyle}color:#15803d;font-weight:600;`;

  const headerRow = `<tr>${headers.map(h => `<th style="${headerStyle}">${h}</th>`).join('')}</tr>`;

  const dataRows = bills.map(b => {
    const payment = b.payments?.[b.payments.length - 1];
    const isPaid = b.status === 'PAID';
    const cells = [
      b.tenantName || '',
      b.tenantPhone || '',
      b.floorNumber != null ? `Floor ${b.floorNumber}` : '',
      b.roomNumber ? `Room ${b.roomNumber}` : '',
      b.bedLabel ? `Bed ${b.bedLabel}` : '',
      b.sharingType ? (SHARING_LABEL[b.sharingType] || `${b.sharingType}-Sharing`) : '',
      monthLabel,
      year,
      b.status || '',
      payment?.mode || '',
      payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : '',
      payment?.reference || '',
      b.totalAmount || 0,
      b.paidAmount || 0,
      (b.totalAmount - b.paidAmount) || 0,
    ];
    return `<tr>${cells.map((cell, i) => {
      const style = (isPaid && i === 8) ? paidStyle : cellStyle;
      return `<td style="${style}">${cell}</td>`;
    }).join('')}</tr>`;
  }).join('');

  const totalCollected = bills.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const totalRemaining = bills.reduce((s, b) => s + ((b.totalAmount || 0) - (b.paidAmount || 0)), 0);
  const totalStyle = `${cellStyle}background:#f0f4ff;font-weight:bold;`;
  const totalGreenStyle = `${totalStyle}color:#15803d;`;
  const totalRedStyle = `${totalStyle}color:#dc2626;`;
  const numCols = headers.length;
  const totalsRow = `<tr>
    <td colspan="12" style="${totalStyle}">TOTAL (${bills.length} tenants)</td>
    <td style="${totalStyle}">${bills.reduce((s,b)=>s+(b.totalAmount||0),0)}</td>
    <td style="${totalGreenStyle}">${totalCollected}</td>
    <td style="${totalRedStyle}">${totalRemaining}</td>
  </tr>`;

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>table{border-collapse:collapse;}</style></head>
<body>
<h3 style="font-family:Arial;color:#1e3a5f;">Rent Report — ${monthLabel} ${year}</h3>
<table style="border-collapse:collapse;font-family:Arial;">${headerRow}${dataRows}${totalsRow}</table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rent_${monthLabel}_${year}.xls`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function RentManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter  = searchParams.get('status')  || '';
  const sharingFilter = searchParams.get('sharing')  || '';
  const floorFilter   = searchParams.get('floor')    || '';
  const search        = searchParams.get('search')   || '';

  const [pg, setPg] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  useEffect(() => {
    api.get('/owner/pg').then(r => { setPg(r.data); if (r.data?.id) loadBills(r.data.id, month, year); })
      .catch(() => setLoading(false));
  }, []);

  const loadBills = (pgId, m, y) => {
    setLoading(true);
    api.get(`/rent/month/${m}/${y}?pgId=${pgId}`)
      .then(r => setBills(r.data))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
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

  const setParam = (key, value) => {
    const next = Object.fromEntries(searchParams.entries());
    if (value) next[key] = value; else delete next[key];
    setSearchParams(next);
  };

  // Derive unique values for filter dropdowns
  const allSharings = [...new Set(bills.map(b => b.sharingType).filter(Boolean))].sort((a, b) => a - b);
  const allFloors   = [...new Set(bills.map(b => b.floorNumber).filter(f => f != null))].sort((a, b) => a - b);

  const filtered = bills.filter(b => {
    const q = search.toLowerCase();
    const matchSearch  = !search || b.tenantName?.toLowerCase().includes(q) || b.tenantPhone?.includes(q) || b.roomNumber?.includes(q);
    const matchStatus  = !statusFilter  || b.status === statusFilter;
    const matchSharing = !sharingFilter || String(b.sharingType) === sharingFilter;
    const matchFloor   = !floorFilter   || String(b.floorNumber) === floorFilter;
    return matchSearch && matchStatus && matchSharing && matchFloor;
  });

  const totalCollected  = filtered.reduce((s, b) => s + b.paidAmount, 0);
  const totalPending    = filtered.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);
  const totalBillAmount = filtered.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const paidCount      = filtered.filter(b => b.status === 'PAID').length;
  const unpaidCount    = filtered.filter(b => b.status === 'UNPAID').length;
  const partialCount   = filtered.filter(b => b.status === 'PARTIAL').length;

  const hasFilters = statusFilter || sharingFilter || floorFilter || search;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Rent Management</h1></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 100 }} value={month}
            onChange={e => { setMonth(+e.target.value); if (pg) loadBills(pg.id, +e.target.value, year); }}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={year}
            onChange={e => { setYear(+e.target.value); if (pg) loadBills(pg.id, month, +e.target.value); }}>
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={generate} disabled={generating}>
            {generating ? 'Generating...' : '⚡ Auto-Generate Bills'}
          </button>
          {filtered.length > 0 && (
            <button className="btn btn-outline" onClick={() => downloadExcel(filtered, month, year)}
              title="Download as Excel">
              ⬇ Export
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-light)' }}>✅</div><div><div className="stat-value">{paidCount}</div><div className="stat-label">Paid</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--danger-light)' }}>❌</div><div><div className="stat-value">{unpaidCount}</div><div className="stat-label">Unpaid</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⚠️</div><div><div className="stat-value">{partialCount}</div><div className="stat-label">Partial</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-light)' }}>💰</div><div><div className="stat-value">₹{(totalCollected/1000).toFixed(1)}k</div><div className="stat-label">Collected</div></div></div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="Search name, phone, room..." value={search}
          onChange={e => setParam('search', e.target.value)} style={{ maxWidth: 220, fontSize: 13 }} />
        <select className="form-select" value={statusFilter} onChange={e => setParam('status', e.target.value)}
          style={{ maxWidth: 140, fontSize: 13 }}>
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PARTIAL">Partial</option>
        </select>
        <select className="form-select" value={floorFilter} onChange={e => setParam('floor', e.target.value)}
          style={{ maxWidth: 140, fontSize: 13 }}>
          <option value="">All Floors</option>
          {allFloors.map(f => <option key={f} value={f}>Floor {f}</option>)}
        </select>
        <select className="form-select" value={sharingFilter} onChange={e => setParam('sharing', e.target.value)}
          style={{ maxWidth: 160, fontSize: 13 }}>
          <option value="">All Sharing</option>
          {allSharings.map(s => <option key={s} value={s}>{SHARING_LABEL[s] || `${s}-Sharing`}</option>)}
        </select>
        {hasFilters && (
          <button className="btn btn-outline btn-sm" onClick={() => {
            const next = Object.fromEntries(searchParams.entries());
            ['status','sharing','floor','search'].forEach(k => delete next[k]);
            setSearchParams(next);
          }}>Clear ✕</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--gray-500)' }}>
          {filtered.length} of {bills.length} bills
        </span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> : bills.length === 0 ? (
          <div className="empty-state"><p>No bills for this month. Click "Auto-Generate Bills" to create them.</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No bills match the selected filters.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th><th>Floor / Room</th><th>Sharing</th>
                  <th>Status</th><th>Total (₹)</th><th>Paid (₹)</th><th>Balance (₹)</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.tenantName}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{b.tenantPhone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      Room {b.roomNumber}, Bed {b.bedLabel}
                      <br />
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floor {b.floorNumber}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {b.sharingType ? (SHARING_LABEL[b.sharingType] || `${b.sharingType}-Sharing`) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'PAID' ? 'badge-green' : b.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td>₹{b.totalAmount?.toLocaleString()}</td>
                    <td style={{ color: 'var(--success)' }}>₹{b.paidAmount?.toLocaleString()}</td>
                    <td style={{ color: b.totalAmount - b.paidAmount > 0 ? 'var(--danger)' : 'var(--gray-500)' }}>
                      ₹{(b.totalAmount - b.paidAmount).toLocaleString()}
                    </td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {b.status !== 'PAID' && (
                        <button className="btn btn-success btn-sm" onClick={() => setPayModal(b)}>Pay</button>
                      )}
                      {b.status === 'PAID' && (
                        <button className="btn btn-outline btn-sm" onClick={async () => {
                          try {
                            const res = await api.get(`/rent/receipt/${b.id}`, { responseType: 'blob' });
                            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                            const a = document.createElement('a');
                            a.href = url;
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(url), 10000);
                          } catch (err) { toast.error('Failed to load receipt: ' + (err.response?.status || err.message)); }
                        }}>
                          🧾 Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 600, background: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', fontSize: 13 }}>Total ({filtered.length} tenants)</td>
                  <td style={{ padding: '10px 12px' }}>₹{totalBillAmount.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--success)' }}>₹{totalCollected.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: totalPending > 0 ? 'var(--danger)' : 'var(--gray-500)' }}>₹{totalPending.toLocaleString()}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {payModal && (
        <PayModal bill={payModal} onClose={() => setPayModal(null)}
          onSaved={() => { setPayModal(null); if (pg) loadBills(pg.id, month, year); }} />
      )}
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
        <div className="modal-header">
          <h3 className="modal-title">Record Payment — {bill.tenantName}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Bill</span><span>₹{bill.totalAmount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid So Far</span><span>₹{bill.paidAmount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: 8 }}><span>Balance</span><span>₹{bill.totalAmount - bill.paidAmount}</span></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group"><label className="form-label">Payment Mode</label>
                <select className="form-select" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                  <option value="CASH">Cash</option><option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option><option value="ONLINE">Online</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Reference / UTR</label>
              <input className="form-input" placeholder="Optional" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn btn-success" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
