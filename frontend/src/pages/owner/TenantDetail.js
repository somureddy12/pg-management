import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vacating, setVacating] = useState(false);

  useEffect(() => {
    api.get(`/tenants/${id}`).then(r => setTenant(r.data)).finally(() => setLoading(false));
  }, [id]);

  const handleVacate = async () => {
    const vacateDate = prompt('Enter vacate date (YYYY-MM-DD):');
    if (!vacateDate) return;
    setVacating(true);
    try {
      await api.post(`/tenants/${id}/vacate`, { vacateDate });
      toast.success('Tenant marked as vacated');
      navigate('/owner/tenants');
    } catch { toast.error('Failed'); } finally { setVacating(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!tenant) return <div>Tenant not found.</div>;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tenant.name}</h1>
          <p className="page-subtitle">Room {tenant.bed?.room?.roomNumber}, Bed {tenant.bed?.bedLabel} · Floor {tenant.bed?.room?.floor?.number}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
          {tenant.status !== 'VACATED' && <button className="btn btn-danger" onClick={handleVacate} disabled={vacating}>{vacating ? 'Processing...' : 'Mark Vacated'}</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Personal Details</h3>
          {[['Phone', tenant.phone], ['Email', tenant.email || '—'], ['Emergency Contact', tenant.emergencyContact || '—'], ['ID Type', tenant.idType], ['ID Number', tenant.idNumber]].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Stay Details</h3>
          {[
            ['Join Date', new Date(tenant.joinDate).toLocaleDateString('en-IN')],
            ['Expected Vacate', tenant.expectedVacate ? new Date(tenant.expectedVacate).toLocaleDateString('en-IN') : '—'],
            ['Monthly Rent', `₹${tenant.monthlyRent?.toLocaleString()}`],
            ['Security Deposit', `₹${tenant.securityDeposit?.toLocaleString()}`],
            ['Status', tenant.status],
            ['Meal Plan', tenant.mealPlan?.name || 'None'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-500)' }}>{label}</span><span style={{ fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Rent History</h3>
          {tenant.rentBills?.length === 0 ? <p style={{ color: 'var(--gray-400)' }}>No rent bills yet.</p> : (
            <table>
              <thead><tr><th>Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>
                {tenant.rentBills?.map(b => (
                  <tr key={b.id}>
                    <td>{months[b.month - 1]} {b.year}</td>
                    <td>₹{b.totalAmount}</td>
                    <td style={{ color: 'var(--success)' }}>₹{b.paidAmount}</td>
                    <td style={{ color: b.totalAmount - b.paidAmount > 0 ? 'var(--danger)' : '' }}>₹{b.totalAmount - b.paidAmount}</td>
                    <td><span className={`badge ${b.status === 'PAID' ? 'badge-green' : b.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {tenant.complaints?.length > 0 && (
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Complaints</h3>
            {tenant.complaints.map(c => (
              <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span className={`badge ${c.status === 'RESOLVED' ? 'badge-green' : 'badge-yellow'}`}>{c.status}</span>
                  <span className="badge badge-gray">{c.category}</span>
                </div>
                <p style={{ fontSize: 14 }}>{c.description}</p>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
