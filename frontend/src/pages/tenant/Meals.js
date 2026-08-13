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
  const now = new Date();
  const open = new Date(post.windowOpen);
  const close = new Date(post.windowClose);
  if (now < open) return 'FUTURE';
  if (now > close) return 'EXPIRED';
  return 'OPEN';
}

export default function TenantMeals() {
  const dateOptions = buildDateOptions();
  const [selectedDate, setSelectedDate] = useState(dateOptions[0].iso);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  // selections: { [postId]: Set of itemIds }
  const [selections, setSelections] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => { loadPosts(selectedDate); }, [selectedDate]);

  const loadPosts = (date) => {
    setLoading(true);
    api.get(`/meals/my?date=${date}`)
      .then(r => {
        setPosts(r.data);
        // seed selections from server
        const init = {};
        r.data.forEach(p => {
          init[p.id] = new Set(
            p.items.filter(i => i.selectedByMe).map(i => i.id)
          );
        });
        setSelections(init);
      })
      .catch(() => toast.error('Failed to load meals'))
      .finally(() => setLoading(false));
  };

  const toggleItem = (postId, itemId) => {
    setSelections(prev => {
      const set = new Set(prev[postId] || []);
      set.has(itemId) ? set.delete(itemId) : set.add(itemId);
      return { ...prev, [postId]: set };
    });
  };

  const saveSelection = async (post) => {
    setSaving(post.id);
    try {
      await api.post('/meals/select', {
        mealPostId: post.id,
        itemIds: [...(selections[post.id] || [])],
      });
      toast.success('Selection saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
      loadPosts(selectedDate);
    } finally {
      setSaving(null);
    }
  };

  // Build a map of mealType → post (or null if not posted)
  const postMap = {};
  MEAL_TYPES.forEach(mt => {
    postMap[mt.key] = posts.find(p => p.mealType === mt.key) || null;
  });

  const windowLabel = (post) => {
    const fmt = (dt) => new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return `${fmt(post.windowOpen)} – ${fmt(post.windowClose)}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meals</h1>
          <p className="page-subtitle">Select your meals for the day</p>
        </div>
      </div>

      {/* Day selector */}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {MEAL_TYPES.map(mt => {
            const post = postMap[mt.key];
            const status = getMealStatus(post);

            // Card styling based on status
            const cardStyle = {
              borderRadius: 12,
              padding: 20,
              border: '2px solid',
              borderColor: status === 'OPEN' ? 'var(--success, #22c55e)'
                         : status === 'FUTURE' ? 'var(--primary, #7c3aed)'
                         : 'var(--gray-200)',
              background: status === 'FUTURE' ? 'var(--primary-light, #f5f3ff)'
                        : status === 'EXPIRED' ? 'var(--gray-50)' : '#fff',
              opacity: status === 'EXPIRED' ? 0.75 : 1,
              display: 'flex', flexDirection: 'column', gap: 12,
            };

            return (
              <div key={mt.key} style={cardStyle}>
                {/* Header */}
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

                {!post ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)', fontSize: 13 }}>
                    Not posted yet
                  </div>
                ) : (
                  <>
                    {/* Window time */}
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {status === 'FUTURE' ? '⏰ Opens at' : status === 'OPEN' ? '✅ Open until' : '🔒 Closed at'}&nbsp;
                      {status === 'FUTURE'
                        ? new Date(post.windowOpen).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : status === 'OPEN'
                        ? new Date(post.windowClose).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : new Date(post.windowClose).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      <span style={{ marginLeft: 6, color: 'var(--gray-400)' }}>({windowLabel(post)})</span>
                    </div>

                    {/* Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {post.items.map(item => {
                        const isSelected = (selections[post.id] || new Set()).has(item.id);
                        const canSelect = status === 'OPEN';
                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={!canSelect}
                            onClick={() => canSelect && toggleItem(post.id, item.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: `1.5px solid ${isSelected ? 'var(--primary, #7c3aed)' : 'var(--gray-200)'}`,
                              background: isSelected ? 'var(--primary-light, #ede9fe)' : 'transparent',
                              cursor: canSelect ? 'pointer' : 'default',
                              textAlign: 'left',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              fontSize: 13,
                              fontWeight: isSelected ? 600 : 400,
                            }}
                          >
                            <span>
                              <span style={{ marginRight: 6 }}>{item.isVeg ? '🟢' : '🔴'}</span>
                              {item.itemName}
                            </span>
                            {isSelected && <span style={{ color: 'var(--primary)', fontSize: 12 }}>✓</span>}
                            {!canSelect && status === 'EXPIRED' && item.selectedByMe && (
                              <span style={{ color: 'var(--gray-400)', fontSize: 11 }}>selected</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Save button — only when window is open */}
                    {status === 'OPEN' && (
                      <button className="btn btn-primary" style={{ marginTop: 4 }}
                        onClick={() => saveSelection(post)} disabled={saving === post.id}>
                        {saving === post.id ? 'Saving...' : 'Save Selection'}
                      </button>
                    )}

                    {status === 'EXPIRED' && (
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
                        Window closed — view only
                      </div>
                    )}

                    {status === 'FUTURE' && (
                      <div style={{ fontSize: 12, color: 'var(--primary)', textAlign: 'center', fontWeight: 500 }}>
                        Selection opens soon
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}