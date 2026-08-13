import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import ClockTimePicker from '../../components/ClockTimePicker';

const STANDARD_TYPES = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { key: 'LUNCH',     label: 'Lunch',     icon: '☀️'  },
  { key: 'DINNER',    label: 'Dinner',    icon: '🌙'  },
];
const STANDARD_KEYS = STANDARD_TYPES.map(t => t.key);

function buildDateOptions() {
  const options = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ iso, label });
  }
  return options;
}

function blankForm() {
  return { windowOpen: '09:00', windowClose: '11:00', items: [{ itemName: '', isVeg: true }] };
}

function getMealStatus(post) {
  if (!post) return null;
  const now = new Date();
  if (now < new Date(post.windowOpen)) return 'FUTURE';
  if (now > new Date(post.windowClose)) return 'EXPIRED';
  return 'OPEN';
}

function cardStyle(status) {
  return {
    borderRadius: 12, padding: 20, border: '2px solid',
    borderColor: status === 'OPEN' ? '#22c55e' : status === 'FUTURE' ? '#7c3aed' : 'var(--gray-200)',
    background: status === 'FUTURE' ? '#f5f3ff' : status === 'EXPIRED' ? 'var(--gray-50)' : '#fff',
    opacity: status === 'EXPIRED' ? 0.8 : 1,
    display: 'flex', flexDirection: 'column', gap: 12,
  };
}

function windowLabel(post) {
  const fmt = dt => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${fmt(post.windowOpen)} – ${fmt(post.windowClose)}`;
}

// Shared item form row component
function ItemRow({ item, idx, total, onChange, onRemove }) {
  return (
    <div style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 8 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <input className="form-input" placeholder={`Item ${idx + 1}`} value={item.itemName}
          onChange={e => onChange(idx, 'itemName', e.target.value)} style={{ flex: 1 }} required />
        {total > 1 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onRemove(idx)}>✕</button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="radio" name={`veg-${idx}`} checked={item.isVeg === true}
            onChange={() => onChange(idx, 'isVeg', true)} />
          🟢 Veg
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
          <input type="radio" name={`veg-${idx}`} checked={item.isVeg === false}
            onChange={() => onChange(idx, 'isVeg', false)} />
          🔴 Non-Veg
        </label>
      </div>
    </div>
  );
}

export default function Meals() {
  const dateOptions = buildDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [posts, setPosts] = useState([]);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  // editing: { mealType, mode: 'new'|'edit', postId?, isCustom }
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [customName, setCustomName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

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
    setEditing(null);
    setShowCustomForm(false);
    if (pg?.id) loadPosts(pg.id, date);
  };

  const startNew = (mealType) => {
    setEditing({ mealType, mode: 'new', isCustom: false });
    setForm(blankForm());
  };

  const startEdit = (post) => {
    const isCustom = !STANDARD_KEYS.includes(post.mealType);
    setEditing({ mealType: post.mealType, mode: 'edit', postId: post.id, isCustom });
    if (isCustom) setCustomName(post.mealType);
    setForm({
      windowOpen: new Date(post.windowOpen).toTimeString().slice(0, 5),
      windowClose: new Date(post.windowClose).toTimeString().slice(0, 5),
      items: post.items.map(i => ({ itemName: i.itemName, isVeg: i.isVeg })),
    });
    setShowCustomForm(false);
  };

  const startCustomNew = () => {
    setEditing({ mealType: '', mode: 'new', isCustom: true });
    setCustomName('');
    setForm(blankForm());
    setShowCustomForm(false);
  };

  const cancelEdit = () => { setEditing(null); setForm(blankForm()); setCustomName(''); };

  const setItem = (idx, key, val) => setForm(prev => {
    const items = [...prev.items];
    items[idx] = { ...items[idx], [key]: val };
    return { ...prev, items };
  });
  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { itemName: '', isVeg: true }] }));
  const removeItem = (idx) => setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!pg?.id || !editing) return;
    const mealType = editing.isCustom ? customName.trim().toUpperCase() : editing.mealType;
    if (editing.isCustom && !mealType) return toast.error('Enter a meal name');
    if (form.items.some(i => !i.itemName.trim())) return toast.error('Fill all item names');
    setSubmitting(true);
    const payload = {
      pgId: pg.id, date: selectedDate, mealType,
      windowOpen: `${selectedDate}T${form.windowOpen}:00`,
      windowClose: `${selectedDate}T${form.windowClose}:00`,
      items: form.items.map(i => ({ itemName: i.itemName.trim(), isVeg: i.isVeg })),
    };
    try {
      if (editing.mode === 'new') { await api.post('/meals', payload); toast.success('Meal posted!'); }
      else { await api.put(`/meals/${editing.postId}`, payload); toast.success('Meal updated!'); }
      setEditing(null); setForm(blankForm()); setCustomName('');
      loadPosts(pg.id, selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this meal post?')) return;
    try {
      await api.delete(`/meals/${id}`);
      toast.success('Deleted');
      setPosts(prev => prev.filter(p => p.id !== id));
      if (editing?.postId === id) cancelEdit();
    } catch { toast.error('Failed to delete'); }
  };

  const postMap = {};
  STANDARD_TYPES.forEach(mt => { postMap[mt.key] = posts.find(p => p.mealType === mt.key) || null; });
  const customPosts = posts.filter(p => !STANDARD_KEYS.includes(p.mealType));

  // Inline form JSX (reused for standard and custom cards)
  const renderForm = () => (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {editing?.isCustom && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Meal Name</label>
          <input className="form-input" placeholder="e.g. Snacks, Tea Time, Special" value={customName}
            onChange={e => setCustomName(e.target.value)} required />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ClockTimePicker label="Window Open" value={form.windowOpen}
          onChange={v => setForm(p => ({ ...p, windowOpen: v }))} />
        <ClockTimePicker label="Window Close" value={form.windowClose}
          onChange={v => setForm(p => ({ ...p, windowClose: v }))} />
      </div>
      <div>
        <label className="form-label">Menu Items</label>
        {form.items.map((item, idx) => (
          <ItemRow key={idx} item={item} idx={idx} total={form.items.length}
            onChange={setItem} onRemove={removeItem} />
        ))}
        <button type="button" className="btn btn-outline btn-sm" onClick={addItem}>+ Add Item</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={cancelEdit}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );

  // Reusable posted-view content
  const renderPostedView = (post, status) => (
    <>
      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
        {status === 'OPEN' ? '✅ Open until' : status === 'FUTURE' ? '⏰ Opens at' : '🔒 Closed'}&nbsp;
        {windowLabel(post)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {post.items.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 14 }}>
            <span><span style={{ marginRight: 6 }}>{item.isVeg ? '🟢' : '🔴'}</span>{item.itemName}</span>
            <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 16 }}>
              {item.selectionCount}<span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 3 }}>sel</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => startEdit(post)}>Edit</button>
        <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--error)' }} onClick={() => handleDelete(post.id)}>Delete</button>
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Post and manage daily meals for your tenants</p>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 300, marginBottom: 28 }}>
        <label className="form-label">Select Day</label>
        <select className="form-select" value={selectedDate} onChange={e => handleDateChange(e.target.value)}>
          {dateOptions.map(opt => (
            <option key={opt.iso} value={opt.iso}>{opt.label} ({opt.iso})</option>
          ))}
        </select>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <>
          {/* Standard 3 cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
            {STANDARD_TYPES.map(mt => {
              const post = postMap[mt.key];
              const status = getMealStatus(post);
              const isEditingThis = editing?.mealType === mt.key && !editing?.isCustom;
              return (
                <div key={mt.key} style={cardStyle(status)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{mt.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{mt.label}</span>
                    </div>
                    {status && (
                      <span className={`badge ${status === 'OPEN' ? 'badge-green' : status === 'FUTURE' ? 'badge-purple' : 'badge-gray'}`}>
                        {status === 'FUTURE' ? 'UPCOMING' : status}
                      </span>
                    )}
                  </div>
                  {!post && !isEditingThis && (
                    <button className="btn btn-outline" onClick={() => startNew(mt.key)}>+ Post {mt.label}</button>
                  )}
                  {post && !isEditingThis && renderPostedView(post, status)}
                  {isEditingThis && renderForm()}
                </div>
              );
            })}
          </div>

          {/* Custom meal posts */}
          {customPosts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
              {customPosts.map(post => {
                const status = getMealStatus(post);
                const isEditingThis = editing?.postId === post.id;
                return (
                  <div key={post.id} style={cardStyle(status)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>✨</span>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{post.mealType}</span>
                      </div>
                      {status && (
                        <span className={`badge ${status === 'OPEN' ? 'badge-green' : status === 'FUTURE' ? 'badge-purple' : 'badge-gray'}`}>
                          {status === 'FUTURE' ? 'UPCOMING' : status}
                        </span>
                      )}
                    </div>
                    {!isEditingThis && renderPostedView(post, status)}
                    {isEditingThis && renderForm()}
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom meal new form */}
          {editing?.isCustom && editing?.mode === 'new' && (
            <div style={{ ...cardStyle(null), borderColor: 'var(--gray-300)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Custom Meal</span>
              </div>
              {renderForm()}
            </div>
          )}

          {/* Add custom meal button */}
          {!editing && (
            <button className="btn btn-outline" style={{ borderStyle: 'dashed', width: '100%', justifyContent: 'center' }}
              onClick={startCustomNew}>
              + Post Custom Meal (Snacks, Tea Time, Special, etc.)
            </button>
          )}
        </>
      )}
    </div>
  );
}