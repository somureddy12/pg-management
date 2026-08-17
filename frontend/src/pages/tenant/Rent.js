import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PAYMENT_MODES = ['UPI', 'BANK_TRANSFER', 'ONLINE', 'CASH'];

export default function TenantRent() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBill, setPayingBill] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', mode: 'UPI', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadBills = () => {
    api.get(`/rent/tenant/${user.id}`).then(r => {
      setBills(r.data);
      // Notify on 1st of every month if there are pending bills
      const today = new Date();
      if (today.getDate() === 1) {
        const pending = r.data.filter(b => b.status !== 'PAID');
        if (pending.length > 0) {
          toast(`🔔 Rent reminder: ${pending.length} pending bill(s). Please pay on time!`, { duration: 6000 });
          if ('Notification' in window) {
            Notification.requestPermission().then(perm => {
              if (perm === 'granted') {
                new Notification('Rent Due!', {
                  body: `You have ${pending.length} pending rent bill(s). Please pay on time.`,
                  icon: '/favicon.ico',
                });
              }
            });
          }
        }
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadBills(); }, []);

  const openPayModal = (bill) => {
    const balance = (bill.totalAmount - bill.paidAmount).toFixed(2);
    setPayingBill(bill);
    setPayForm({ amount: balance, mode: 'UPI', reference: '' });
  };

  const handlePay = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/rent/tenant/pay', {
        rentBillId: payingBill.id,
        amount: parseFloat(payForm.amount),
        mode: payForm.mode,
        reference: payForm.reference || null,
      });
      toast.success('Payment recorded successfully!');
      setPayingBill(null);
      loadBills();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment failed. Try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Rent & Payments</h1></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bills.length === 0 && <div className="empty-state"><p>No rent bills yet.</p></div>}
        {bills.map(bill => {
          const balance = bill.totalAmount - bill.paidAmount;
          return (
            <div key={bill.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{MONTHS[bill.month - 1]} {bill.year}</h3>
                  <span className={`badge ${bill.status === 'PAID' ? 'badge-green' : bill.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>{bill.status}</span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>₹{bill.totalAmount?.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Due: {new Date(bill.dueDate).toLocaleDateString('en-IN')}</div>
                  {bill.status !== 'PAID' && (
                    <button className="btn btn-primary btn-sm" onClick={() => openPayModal(bill)}>💳 Pay Now</button>
                  )}
                </div>
              </div>

              <div style={{ margin: '14px 0', borderTop: '1px solid var(--gray-100)', paddingTop: 14 }}>
                <div className="rent-row"><span>Room Rent</span><span>₹{bill.roomRent}</span></div>
                {bill.messCharges > 0 && <div className="rent-row"><span>Mess Charges</span><span>₹{bill.messCharges}</span></div>}
                {bill.electricity > 0 && <div className="rent-row"><span>Electricity</span><span>₹{bill.electricity}</span></div>}
                {bill.lateFee > 0 && <div className="rent-row"><span style={{ color: 'var(--danger)' }}>Late Fee</span><span style={{ color: 'var(--danger)' }}>₹{bill.lateFee}</span></div>}
                <div className="rent-row" style={{ fontWeight: 700 }}><span>Amount Paid</span><span style={{ color: 'var(--success)' }}>₹{bill.paidAmount}</span></div>
                {balance > 0 && (
                  <div className="rent-row" style={{ fontWeight: 700 }}><span>Balance Due</span><span style={{ color: 'var(--danger)' }}>₹{balance}</span></div>
                )}
              </div>

              {bill.payments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Payment History</div>
                  {bill.payments.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--gray-100)' }}>
                      <span>{new Date(p.paymentDate).toLocaleDateString('en-IN')} · {p.mode}{p.reference ? ` · Ref: ${p.reference}` : ''}</span>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}

              {bill.payments?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-outline btn-sm" onClick={async () => {
                    try {
                      const res = await api.get(`/rent/receipt/${bill.id}`, { responseType: 'blob' });
                      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                      const a = document.createElement('a');
                      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
                      document.body.appendChild(a); a.click(); document.body.removeChild(a);
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                    } catch { toast.error('Failed to download receipt'); }
                  }}>🧾 Download Receipt</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pay Modal */}
      {payingBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, maxWidth: '90vw' }}>
            <h3 className="card-title" style={{ marginBottom: 4 }}>Pay Rent</h3>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 16 }}>
              {MONTHS[payingBill.month - 1]} {payingBill.year} · Balance: ₹{(payingBill.totalAmount - payingBill.paidAmount).toLocaleString()}
            </p>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min="1" max={payingBill.totalAmount - payingBill.paidAmount}
                  value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-select" value={payForm.mode} onChange={e => setPayForm({ ...payForm, mode: e.target.value })}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>
              {payForm.mode !== 'CASH' && (
                <div className="form-group">
                  <label className="form-label">Reference / UTR Number</label>
                  <input className="form-input" placeholder="e.g. UPI ref or transaction ID"
                    value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setPayingBill(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Processing...' : 'Confirm Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
