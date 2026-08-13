import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'];

const defaultForm = () => ({
  mealType: 'LUNCH',
  date: new Date().toISOString().split('T')[0],
  windowOpen: '',
  windowClose: '',
  items: [{ itemName: '', isVeg: true }],
});

export default function Meals() {
  const [posts, setPosts] = useState([]);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) loadPosts(r.data.id, selectedDate);
    });
  }, []);

  const loadPosts = (pgId, date) => {
    setLoading(true);
    api.get(`/meals?pgId=${pgId}&date=${date}`)
      .then(r => setPosts(r.data))
      .catch(() => toast.error('Failed to load meals'))
      .finally(() => setLoading(false));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (pg?.id) loadPosts(pg.id, date);
  };

  const setItem = (idx, key, val) => {
    setForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [key]: val };
      return { ...prev, items };
    });
  };

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { itemName: '', isVeg: true }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pg?.id) return;
    if (!form.windowOpen || !form.windowClose) return toast.error('Set selection window times');
    if (form.items.some(i => !i.itemName.trim())) return toast.error('Fill all item names');
    setSubmitting(true);
    try {
      await api.post('/meals', {
        pgId: pg.id,
        date: form.date,
        mealType: form.mealType,
        windowOpen: `${form.date}T${form.windowOpen}:00`,
        windowClose: `${form.date}T${form.windowClose}:00`,
        items: form.items.map(i => ({ itemName: i.itemName.trim(), isVeg: i.isVeg })),
      });
      toast.success('Meal posted!');
      setShowForm(false);
      setForm(defaultForm());
      loadPosts(pg.id, selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post meal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal post?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Deleted');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  const isOpen = (post) => {
    const now = new Date();
    return now >= new Date(post.windowOpen) && now <= new Date(post.windowClose);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Post daily meals and track tenant selections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Post Meal'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Post a Meal</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Meal Type</label>
                <select className="form-select" value={form.mealType} onChange={e => setForm(p => ({ ...p, mealType: e.target.value }))}>
                  {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Window Open</label>
                  <input className="form-input" type="time" value={form.windowOpen} onChange={e => setForm(p => ({ ...p, windowOpen: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Window Close</label>
                  <input className="form-input" type="time" value={form.windowClose} onChange={e => setForm(p => ({ ...p, windowClose: e.target.value }))} required />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Menu Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="form-input" placeholder={`Item ${idx + 1}`} value={item.itemName}
                    onChange={e => setItem(idx, 'itemName', e.target.value)} style={{ flex: 1 }} required />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.isVeg} onChange={e => setItem(idx, 'isVeg', e.target.checked)} />
                    Veg
                  </label>
                  {form.items.length > 1 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => removeItem(idx)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Posting...' : 'Post Meal'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <label className="form-label" style={{ margin: 0 }}>Date:</label>
        <input className="form-input" type="date" value={selectedDate}
          onChange={e => handleDateChange(e.target.value)} style={{ width: 160 }} />
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="card">
          <div className="empty-state"><p>No meals posted for this date. Click "Post Meal" to add one.</p></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map(post => (
            <div key={post.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{post.mealType === 'BREAKFAST' ? '🌅' : post.mealType === 'LUNCH' ? '☀️' : '🌙'}</span>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{post.mealType}</h3>
                    <span className={`badge ${isOpen(post) ? 'badge-green' : 'badge-gray'}`}>
                      {isOpen(post) ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                    Selection window: {new Date(post.windowOpen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} — {new Date(post.windowClose).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button className="btn btn-outline btn-sm" title="Delete" style={{ color: 'var(--error)' }} onClick={() => handleDelete(post.id)}>🗑️</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {post.items.map(item => (
                  <div key={item.id} style={{ padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>
                        <span style={{ marginRight: 6 }}>{item.isVeg ? '🟢' : '🔴'}</span>
                        {item.itemName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>{item.selectionCount}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>selected</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}