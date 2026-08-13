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

function blankForm(date) {
  const d = date || new Date().toISOString().split('T')[0];
  return {
    windowCloseDate: d, windowCloseTime: '11:00',
    defaultItemIdx: 0,
    items: [{ itemName: '', isVeg: true }],
  };
}

function getMealStatus(post) {
  if (!post) return null;
  return new Date() > new Date(post.windowClose) ? 'EXPIRED' : 'OPEN';
}

function baseCardStyle(status) {
  return {
    borderRadius: 12, padding: 20, border: '2px solid',
    borderColor: status === 'OPEN' ? '#22c55e' : 'var(--gray-200)',
    background: status === 'EXPIRED' ? 'var(--gray-50)' : '#fff',
    opacity: status === 'EXPIRED' ? 0.8 : 1,
    display: 'flex', flexDirection: 'column', gap: 12,
    transition: 'transform 0.2s, box-shadow 0.2s',
  };
}

function closeLabel(post) {
  const close = new Date(post.windowClose);
  const fmt = dt => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = dt => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return close.toDateString() === new Date().toDateString()
    ? fmt(close)
    : `${fmtDate(close)}, ${fmt(close)}`;
}

function ItemRow({ item, idx, total, onChange, onRemove, showVeg, formId, isDefault, onSetDefault }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, paddingTop: 7 }}>
        <input
          type="radio"
          name={`${formId}-default`}
          checked={isDefault}
          onChange={onSetDefault}
          title="Set as default"
          style={{ cursor: 'pointer', accentColor: '#7c3aed', width: 14, height: 14 }}
        />
      </div>
      <div style={{ flex: 1, padding: '6px 8px', background: 'var(--gray-50)', borderRadius: 8,
        border: isDefault ? '1.5px solid #7c3aed' : '1.5px solid transparent' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: showVeg ? 4 : 0 }}>
          <input className="form-input" placeholder={`Item ${idx + 1}`} value={item.itemName}
            onChange={e => onChange(idx, 'itemName', e.target.value)}
            style={{ flex: 1, padding: '4px 8px', fontSize: 13 }} required />
          {total > 1 && (
            <button type="button" onClick={() => onRemove(idx)}
              style={{ padding: '0 8px', borderRadius: 6, border: '1px solid var(--gray-200)',
                background: '#fff', cursor: 'pointer', color: 'var(--gray-500)', fontSize: 13 }}>✕</button>
          )}
        </div>
        {showVeg && (
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
              <input type="radio" name={`${formId}-veg-${idx}`} checked={item.isVeg === true}
                onChange={() => onChange(idx, 'isVeg', true)} />
              🟢 Veg
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
              <input type="radio" name={`${formId}-veg-${idx}`} checked={item.isVeg === false}
                onChange={() => onChange(idx, 'isVeg', false)} />
              🔴 Non-Veg
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Meals() {
  const dateOptions = buildDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].iso);
  const [posts, setPosts] = useState([]);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm());
  const [customName, setCustomName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) loadPosts(r.data.id, dateOptions[1].iso);
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
    if (pg?.id) loadPosts(pg.id, date);
  };

  const startNew = (mealType) => {
    setEditing({ mealType, mode: 'new', isCustom: false });
    setForm(blankForm(selectedDate));
  };

  const startEdit = (post) => {
    const isCustom = !STANDARD_KEYS.includes(post.mealType);
    setEditing({ mealType: post.mealType, mode: 'edit', postId: post.id, isCustom });
    if (isCustom) setCustomName(post.mealType);
    const close = new Date(post.windowClose);
    const defIdx = post.items.findIndex(i => i.isDefault);
    setForm({
      windowCloseDate: close.toISOString().split('T')[0],
      windowCloseTime: close.toTimeString().slice(0, 5),
      defaultItemIdx: defIdx >= 0 ? defIdx : 0,
      items: post.items.map(i => ({ itemName: i.itemName, isVeg: i.isVeg })),
    });
  };

  const startCustomNew = () => {
    setEditing({ mealType: '', mode: 'new', isCustom: true });
    setCustomName('');
    setForm(blankForm(selectedDate));
  };

  const cancelEdit = () => { setEditing(null); setForm(blankForm(selectedDate)); setCustomName(''); };

  const setItem = (idx, key, val) => setForm(prev => {
    const items = [...prev.items];
    items[idx] = { ...items[idx], [key]: val };
    return { ...prev, items };
  });

  const addItem = () => setForm(prev => ({ ...prev, items: [...prev.items, { itemName: '', isVeg: true }] }));

  const removeItem = (idx) => setForm(prev => {
    const items = prev.items.filter((_, i) => i !== idx);
    let defaultItemIdx = prev.defaultItemIdx;
    if (defaultItemIdx === idx) defaultItemIdx = 0;
    else if (defaultItemIdx > idx) defaultItemIdx -= 1;
    return { ...prev, items, defaultItemIdx };
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!pg?.id || !editing) return;
    const mealType = editing.isCustom ? customName.trim().toUpperCase() : editing.mealType;
    if (editing.isCustom && !mealType) return toast.error('Enter a meal name');
    if (form.items.some(i => !i.itemName.trim())) return toast.error('Fill all item names');
    setSubmitting(true);
    const payload = {
      pgId: pg.id, date: selectedDate, mealType,
      windowClose: `${form.windowCloseDate}T${form.windowCloseTime}:00`,
      items: form.items.map((i, idx) => ({
        itemName: i.itemName.trim(),
        isVeg: i.isVeg,
        isDefault: idx === form.defaultItemIdx,
      })),
    };
    try {
      if (editing.mode === 'new') { await api.post('/meals', payload); toast.success('Meal posted!'); }
      else { await api.put(`/meals/${editing.postId}`, payload); toast.success('Meal updated!'); }
      setEditing(null); setForm(blankForm(selectedDate)); setCustomName('');
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

  const IconButtons = () => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6 }}>
      <button type="submit" title="Save changes" disabled={submitting}
        style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: submitting ? '#86efac' : '#22c55e', color: '#fff',
          fontSize: 20, cursor: submitting ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
        }}>
        {submitting ? '…' : '✓'}
      </button>
      <button type="button" title="Cancel" onClick={cancelEdit}
        style={{
          width: 38, height: 38, borderRadius: '50%', border: '1.5px solid var(--gray-300)',
          background: '#fff', color: 'var(--gray-500)', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        ✕
      </button>
    </div>
  );

  const formId = editing?.mealType || 'custom';

  const renderForm = () => (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {editing?.isCustom && (
        <input className="form-input" placeholder="Meal name (e.g. Snacks, Tea Time)" value={customName}
          onChange={e => setCustomName(e.target.value)} required style={{ fontSize: 13 }} />
      )}

      <div>
        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 3 }}>Selection Closes</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          <input type="date" className="form-input" value={form.windowCloseDate}
            onChange={e => setForm(p => ({ ...p, windowCloseDate: e.target.value }))}
            style={{ flex: '0 0 130px', fontSize: 12, padding: '4px 8px' }} />
          <ClockTimePicker value={form.windowCloseTime} onChange={v => setForm(p => ({ ...p, windowCloseTime: v }))} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <div style={{ width: 28, textAlign: 'center', fontSize: 10, color: '#7c3aed', fontWeight: 700 }}>
            Default
          </div>
          <span style={{ color: 'var(--gray-300)', fontSize: 13, lineHeight: 1 }}>|</span>
          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>Menu Items</div>
        </div>

        {form.items.map((item, idx) => (
          <ItemRow
            key={idx} item={item} idx={idx} total={form.items.length}
            onChange={setItem} onRemove={removeItem}
            showVeg={!editing?.isCustom}
            formId={formId}
            isDefault={form.defaultItemIdx === idx}
            onSetDefault={() => setForm(p => ({ ...p, defaultItemIdx: idx }))}
          />
        ))}
        <button type="button" onClick={addItem}
          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px dashed var(--gray-300)',
            background: 'transparent', cursor: 'pointer', color: 'var(--gray-500)', marginTop: 2, marginLeft: 34 }}>
          + Add Item
        </button>
      </div>

      <IconButtons />
    </form>
  );

  const renderPostedView = (post, status) => (
    <>
      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
        {status === 'OPEN' ? '✅ Open until' : '🔒 Closed'}
        {status === 'OPEN' && <span style={{ marginLeft: 4 }}>{closeLabel(post)}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {post.items.map(item => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 10px', borderRadius: 8, fontSize: 13,
            background: item.isDefault ? '#f5f3ff' : 'var(--gray-50)',
            border: item.isDefault ? '1.5px solid #7c3aed' : '1.5px solid transparent',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ marginRight: 4 }}>{item.isVeg ? '🟢' : '🔴'}</span>
              {item.itemName}
            </span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {item.isDefault && (
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: '#7c3aed',
                  borderRadius: 3, padding: '1px 4px' }}>DEFAULT</span>
              )}
              {item.defaultCount > 0 && (
                <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 600 }}>⭐{item.defaultCount}</span>
              )}
              <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 15 }}>
                {item.selectionCount}<span style={{ fontSize: 10, color: 'var(--gray-400)', marginLeft: 2 }}>sel</span>
              </span>
            </span>
          </div>
        ))}
      </div>
      {status !== 'EXPIRED' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => startEdit(post)}>Edit</button>
          <button className="btn btn-outline btn-sm" style={{ flex: 1, color: 'var(--error)' }} onClick={() => handleDelete(post.id)}>Delete</button>
        </div>
      )}
    </>
  );

  const renderCard = (key, status, isEditingThis, header, body) => (
    <div key={key} style={{
      ...baseCardStyle(status),
      ...(isEditingThis ? {
        transform: 'scale(1.05)',
        transformOrigin: 'center',
        zIndex: 20, position: 'relative',
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
      } : {}),
    }}>
      {header}
      {body}
    </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20, alignItems: 'start' }}>
            {STANDARD_TYPES.map(mt => {
              const post = postMap[mt.key];
              const status = getMealStatus(post);
              const isEditingThis = editing?.mealType === mt.key && !editing?.isCustom;
              const header = (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{mt.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{mt.label}</span>
                  </div>
                  {status && (
                    <span className={`badge ${status === 'OPEN' ? 'badge-green' : 'badge-gray'}`}>
                      {status}
                    </span>
                  )}
                </div>
              );
              const body = isEditingThis ? renderForm()
                : post ? renderPostedView(post, status)
                : <button className="btn btn-outline" onClick={() => startNew(mt.key)}>+ Post {mt.label}</button>;
              return renderCard(mt.key, status, isEditingThis, header, body);
            })}
          </div>

          {customPosts.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20, alignItems: 'start' }}>
              {customPosts.map(post => {
                const status = getMealStatus(post);
                const isEditingThis = editing?.postId === post.id;
                const header = (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>✨</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{post.mealType}</span>
                    </div>
                    {status && (
                      <span className={`badge ${status === 'OPEN' ? 'badge-green' : 'badge-gray'}`}>
                        {status}
                      </span>
                    )}
                  </div>
                );
                const body = isEditingThis ? renderForm() : renderPostedView(post, status);
                return renderCard(post.id, status, isEditingThis, header, body);
              })}
            </div>
          )}

          {editing?.isCustom && editing?.mode === 'new' && (
            <div style={{ ...baseCardStyle(null), borderColor: 'var(--gray-300)', marginBottom: 20, maxWidth: 420,
              transform: 'scale(1.02)', transformOrigin: 'center', position: 'relative', zIndex: 20,
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 22 }}>✨</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Custom Meal</span>
              </div>
              {renderForm()}
            </div>
          )}

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
