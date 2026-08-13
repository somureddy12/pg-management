import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function TenantRent() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/rent/tenant/${user.id}`).then(r => setBills(r.data)).finally(() => setLoading(false));
  }, []);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Rent & Payments</h1></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bills.length === 0 && <div className="empty-state"><p>No rent bills yet.</p></div>}
        {bills.map(bill => (
          <div key={bill.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{months[bill.month - 1]} {bill.year}</h3>
                <span className={`badge ${bill.status === 'PAID' ? 'badge-green' : bill.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>{bill.status}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>₹{bill.totalAmount?.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>Due: {new Date(bill.dueDate).toLocaleDateString('en-IN')}</div>
              </div>
            </div>
            <div style={{ margin: '14px 0', borderTop: '1px solid var(--gray-100)', paddingTop: 14 }}>
              <div className="rent-row"><span>Room Rent</span><span>₹{bill.roomRent}</span></div>
              {bill.messCharges > 0 && <div className="rent-row"><span>Mess Charges</span><span>₹{bill.messCharges}</span></div>}
              {bill.electricity > 0 && <div className="rent-row"><span>Electricity</span><span>₹{bill.electricity}</span></div>}
              {bill.lateFee > 0 && <div className="rent-row"><span style={{ color: 'var(--danger)' }}>Late Fee</span><span style={{ color: 'var(--danger)' }}>₹{bill.lateFee}</span></div>}
              <div className="rent-row" style={{ fontWeight: 700 }}><span>Amount Paid</span><span style={{ color: 'var(--success)' }}>₹{bill.paidAmount}</span></div>
              {bill.totalAmount - bill.paidAmount > 0 && (
                <div className="rent-row" style={{ fontWeight: 700 }}><span>Balance Due</span><span style={{ color: 'var(--danger)' }}>₹{bill.totalAmount - bill.paidAmount}</span></div>
              )}
            </div>
            {bill.payments?.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 8 }}>Payment History</div>
                {bill.payments.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderTop: '1px solid var(--gray-100)' }}>
                    <span>{new Date(p.paymentDate).toLocaleDateString('en-IN')} · {p.mode}</span>
                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{p.amount}</span>
                  </div>
                ))}
              </div>
            )}
            {bill.status === 'PAID' && (
              <div style={{ marginTop: 12 }}>
                <a href={`http://localhost:8080/api/rent/receipt/${bill.id}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">🧾 Download Receipt</a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
