import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const MEAL_TYPES = [
  { key: 'BREAKFAST', label: 'Breakfast', icon: '🌅' },
  { key: 'LUNCH',     label: 'Lunch',     icon: '☀️'  },
  { key: 'DINNER',    label: 'Dinner',    icon: '🌙'  },
];

function buildDateOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i <= 6; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    options.push({ iso, label });
  }
  return options;
}

function getMealStatus(post) {
  if (!post) return null;
  return new Date() > new Date(post.windowClose) ? 'EXPIRED' : 'OPEN';
}

function closeLabel(post) {
  const close = new Date(post.windowClose);
  const fmt = dt => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = dt => new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return close.toDateString() === new Date().toDateString()
    ? fmt(close)
    : `${fmtDate(close)}, ${fmt(close)}`;
}

export default function TenantMeals() {
  const dateOptions = buildDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].iso);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState({});  // { [postId]: itemId | null }
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadPosts(selectedDate); }, [selectedDate]);

  const loadPosts = (date) => {
    setLoading(true);
    api.get(`/meals/my?date=${date}`)
      .then(r => {
        setPosts(r.data);
        const initSel = {};
        r.data.forEach(p => {
          const selected = p.items.find(i => i.selectedByMe);
          initSel[p.id] = selected ? selected.id : null;
        });
        setSelections(initSel);
      })
      .catch(() => toast.error('Failed to load meals'))
      .finally(() => setLoading(false));
  };

  const selectItem = (postId, itemId) => {
    setSelections(prev => ({
      ...prev,
      [postId]: prev[postId] === itemId ? null : itemId,
    }));
  };

  const saveSelection = async (post) => {
    setSaving(post.id);
    const itemId = selections[post.id];
    try {
      await api.post('/meals/select', {
        mealPostId: post.id,
        itemIds: itemId ? [itemId] : [],
      });
      toast.success('Selection saved!');
      loadPosts(selectedDate);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
      loadPosts(selectedDate);
    } finally { setSaving(null); }
  };

  const STANDARD_KEYS = ['BREAKFAST', 'LUNCH', 'DINNER'];
  const postMap = {};
  MEAL_TYPES.forEach(mt => { postMap[mt.key] = posts.find(p => p.mealType === mt.key) || null; });
  const customPosts = posts.filter(p => !STANDARD_KEYS.includes(p.mealType));

  const renderMealCard = (post, status, label, icon, cardKey, isCustom = false) => {
    const canSelect = status === 'OPEN' && !post.hasSubmitted;
    const selectedItemId = selections[post.id] ?? null;

    return (
      <div key={cardKey} style={{
        borderRadius: 12, padding: 20, border: '2px solid',
        borderColor: status === 'OPEN' ? '#22c55e' : 'var(--gray-200)',
        background: status === 'EXPIRED' ? 'var(--gray-50)' : '#fff',
        opacity: status === 'EXPIRED' ? 0.75 : 1,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{label}</span>
          </div>
          {status && (
            <span className={`badge ${status === 'OPEN' ? 'badge-green' : 'badge-gray'}`}>
              {status}
            </span>
          )}
        </div>

        {/* Close time */}
        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
          {status === 'OPEN' ? '✅ Open until' : '🔒 Closed'}
          {status === 'OPEN' && <span style={{ marginLeft: 4 }}>{closeLabel(post)}</span>}
        </div>

        {/* Items — single select */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {post.items.map(item => {
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!canSelect}
                onClick={() => canSelect && selectItem(post.id, item.id)}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                  border: `1.5px solid ${isSelected ? '#7c3aed' : 'var(--gray-200)'}`,
                  background: isSelected ? '#ede9fe' : 'transparent',
                  cursor: canSelect ? 'pointer' : 'default', fontSize: 13,
                  fontWeight: isSelected ? 600 : 400,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!isCustom && <span>{item.isVeg ? '🟢' : '🔴'}</span>}
                  <span>{item.itemName}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.isDefault && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#fff', background: '#7c3aed',
                      borderRadius: 3, padding: '1px 5px',
                    }}>DEFAULT</span>
                  )}
                  {isSelected && <span style={{ color: '#7c3aed', fontSize: 14 }}>✓</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submit icon button */}
        {status === 'OPEN' && !post.hasSubmitted && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button
              type="button"
              title="Submit selection"
              onClick={() => saveSelection(post)}
              disabled={saving === post.id || !selectedItemId}
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: (!selectedItemId || saving === post.id) ? '#86efac' : '#22c55e',
                color: '#fff', fontSize: 22,
                cursor: (!selectedItemId || saving === post.id) ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(34,197,94,0.35)',
                transition: 'background 0.15s',
              }}
            >
              {saving === post.id ? '…' : '✓'}
            </button>
          </div>
        )}

        {status === 'OPEN' && post.hasSubmitted && (
          <div style={{ fontSize: 12, color: '#22c55e', textAlign: 'center', fontWeight: 600 }}>
            ✅ Selection submitted
          </div>
        )}
        {status === 'EXPIRED' && (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
            {post.hasSubmitted ? '✅ Selection recorded' : 'Window closed — no selection'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Select your meals for the day</p>
        </div>
      </div>

      <div className="form-group" style={{ maxWidth: 300, marginBottom: 28 }}>
        <label className="form-label">Select Day</label>
        <select className="form-select" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}>
          {dateOptions.map(opt => (
            <option key={opt.iso} value={opt.iso}>{opt.label} ({opt.iso})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'start' }}>
            {MEAL_TYPES.map(mt => {
              const post = postMap[mt.key];
              const status = getMealStatus(post);
              if (!post) {
                return (
                  <div key={mt.key} style={{
                    borderRadius: 12, padding: 20, border: '2px solid var(--gray-200)',
                    background: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{mt.icon}</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{mt.label}</span>
                    </div>
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)', fontSize: 13 }}>
                      Not posted yet
                    </div>
                  </div>
                );
              }
              return renderMealCard(post, status, mt.label, mt.icon, mt.key, false);
            })}
          </div>

          {customPosts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Other Meals</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>
                {customPosts.map(post => {
                  const status = getMealStatus(post);
                  return renderMealCard(post, status, post.mealType, '✨', post.id, true);
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
