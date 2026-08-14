import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function blankEditForm(t) {
  return {
    name: t.name || '',
    phone: t.phone || '',
    email: t.email || '',
    emergencyContact: t.emergencyContact || '',
    idType: t.idType || '',
    idNumber: t.idNumber || '',
    monthlyRent: t.monthlyRent ?? '',
    securityDeposit: t.securityDeposit ?? '',
    expectedVacate: t.expectedVacate || '',
  };
}

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vacating, setVacating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/tenants/${id}`).then(r => setTenant(r.data)).finally(() => setLoading(false));
  }, [id]);

  const startEdit = () => { setForm(blankEditForm(tenant)); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setForm(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        monthlyRent: parseFloat(form.monthlyRent),
        securityDeposit: form.securityDeposit !== '' ? parseFloat(form.securityDeposit) : null,
        expectedVacate: form.expectedVacate || null,
      };
      const res = await api.put(`/tenants/${id}`, payload);
      setTenant(res.data);
      setEditing(false);
      setForm(null);
      toast.success('Tenant updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

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

  const field = (label, key, type = 'text', opts = {}) => (
    <div className="form-group" style={{ marginBottom: 12 }}>
      <label className="form-label" style={{ fontSize: 12 }}>{label}</label>
      <input
        className="form-input"
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        style={{ fontSize: 13 }}
        {...opts}
      />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{tenant.name}</h1>
          <p className="page-subtitle">
            Room {tenant.roomNumber}, Bed {tenant.bedLabel} · Floor {tenant.floorNumber}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
          {!editing && tenant.status !== 'VACATED' && (
            <button className="btn btn-outline" onClick={startEdit}>Edit Details</button>
          )}
          {tenant.status !== 'VACATED' && (
            <button className="btn btn-danger" onClick={handleVacate} disabled={vacating}>
              {vacating ? 'Processing...' : 'Mark Vacated'}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Personal Details</h3>
              {field('Full Name', 'name', 'text', { required: true })}
              {field('Phone', 'phone', 'tel', { required: true })}
              {field('Email', 'email', 'email')}
              {field('Emergency Contact', 'emergencyContact', 'tel')}
              {field('ID Type', 'idType', 'text', { required: true })}
              {field('ID Number', 'idNumber', 'text', { required: true })}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Stay Details</h3>
              {field('Monthly Rent (₹)', 'monthlyRent', 'number', { required: true, min: 1 })}
              {field('Security Deposit (₹)', 'securityDeposit', 'number', { min: 0 })}
              {field('Expected Vacate Date', 'expectedVacate', 'date')}
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                Join date and bed assignment cannot be changed here.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Personal Details</h3>
            {[
              ['Phone', tenant.phone],
              ['Email', tenant.email || '—'],
              ['Emergency Contact', tenant.emergencyContact || '—'],
              ['ID Type', tenant.idType],
              ['ID Number', tenant.idNumber],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
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
              ['Status', tenant.status?.replace('_', ' ')],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
                <span style={{ color: 'var(--gray-500)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <h3 className="card-title" style={{ marginBottom: 16 }}>Rent History</h3>
            {!tenant.rentBills?.length ? <p style={{ color: 'var(--gray-400)' }}>No rent bills yet.</p> : (
              <table>
                <thead><tr><th>Month</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>
                  {tenant.rentBills.map(b => (
                    <tr key={b.id}>
                      <td>{months[b.month - 1]} {b.year}</td>
                      <td>₹{b.totalAmount}</td>
                      <td style={{ color: 'var(--success)' }}>₹{b.paidAmount}</td>
                      <td style={{ color: b.totalAmount - b.paidAmount > 0 ? 'var(--danger)' : '' }}>
                        ₹{b.totalAmount - b.paidAmount}
                      </td>
                      <td>
                        <span className={`badge ${b.status === 'PAID' ? 'badge-green' : b.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                          {b.status}
                        </span>
                      </td>
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
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
