import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['GROCERIES', 'MAINTENANCE', 'ELECTRICITY', 'STAFF', 'WATER', 'INTERNET', 'OTHER'];

export default function Expenses() {
  const [pg, setPg] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: 'GROCERIES', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/owner/pg').then(r => { setPg(r.data); if (r.data?.id) load(r.data.id); });
  }, []);

  const load = (pgId) => api.get(`/expenses/${pgId}`).then(r => setExpenses(r.data));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/expenses', { pgId: pg.id, ...form, amount: parseFloat(form.amount) });
      toast.success('Expense added'); setShowForm(false); setForm({ category: 'GROCERIES', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      load(pg.id);
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/expenses/${id}`); toast.success('Deleted'); load(pg.id);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Expenses</h1><p className="page-subtitle">Total: ₹{total.toLocaleString()}</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Expense</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>New Expense</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-3">
              <div className="form-group"><label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><input className="form-input" placeholder="What was this for?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Expense'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {expenses.length === 0 ? <div className="empty-state"><p>No expenses recorded yet.</p></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 13 }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td><span className="badge badge-gray">{e.category}</span></td>
                    <td>{e.description}</td>
                    <td style={{ fontWeight: 600 }}>₹{e.amount.toLocaleString()}</td>
                    <td><button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }} onClick={() => deleteExpense(e.id)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
