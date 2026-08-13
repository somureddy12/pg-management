import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function TenantMeals() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // postId being saved

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = () => {
    setLoading(true);
    api.get('/meals/my')
      .then(r => setPosts(r.data))
      .catch(() => toast.error('Failed to load meals'))
      .finally(() => setLoading(false));
  };

  const toggleItem = (postId, itemId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        items: p.items.map(i => i.id === itemId ? { ...i, selectedByMe: !i.selectedByMe } : i)
      };
    }));
  };

  const submitSelection = async (post) => {
    if (!post.isOpen) return toast.error('Selection window is closed');
    const selectedIds = post.items.filter(i => i.selectedByMe).map(i => i.id);
    setSaving(post.id);
    try {
      await api.post('/meals/select', { mealPostId: post.id, itemIds: selectedIds });
      toast.success('Selection saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save selection');
      loadPosts(); // revert to server state on error
    } finally {
      setSaving(null);
    }
  };

  const isOpen = (post) => {
    const now = new Date();
    return now >= new Date(post.windowOpen) && now <= new Date(post.windowClose);
  };

  const windowStatus = (post) => {
    const now = new Date();
    const open = new Date(post.windowOpen);
    const close = new Date(post.windowClose);
    if (now < open) return `Opens at ${open.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    if (now > close) return `Closed at ${close.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    return `Open until ${close.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Today's Meals</h1>
          <p className="page-subtitle">Select what you'd like to eat today</p>
        </div>
        <button className="btn btn-outline" onClick={loadPosts}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : posts.length === 0 ? (
        <div className="card">
          <div className="empty-state"><p>No meals posted for today yet. Check back later.</p></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {posts.map(post => {
            const open = isOpen(post);
            return (
              <div key={post.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{post.mealType === 'BREAKFAST' ? '🌅' : post.mealType === 'LUNCH' ? '☀️' : '🌙'}</span>
                      <h3 style={{ margin: 0, fontSize: 20 }}>{post.mealType}</h3>
                      <span className={`badge ${open ? 'badge-green' : 'badge-gray'}`}>{open ? 'OPEN' : 'CLOSED'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>{windowStatus(post)}</div>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
                  {open ? 'Tap items to select or deselect, then save.' : 'Selection window is closed.'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 16 }}>
                  {post.items.map(item => (
                    <button key={item.id} type="button"
                      onClick={() => open && toggleItem(post.id, item.id)}
                      style={{
                        padding: '12px 16px', borderRadius: 8, border: `2px solid ${item.selectedByMe ? 'var(--primary)' : 'var(--gray-200)'}`,
                        background: item.selectedByMe ? 'var(--primary-light, #ede9fe)' : 'var(--gray-50)',
                        cursor: open ? 'pointer' : 'default', textAlign: 'left', transition: 'all 0.15s'
                      }}>
                      <div style={{ fontSize: 13, marginBottom: 2 }}>
                        <span style={{ marginRight: 6 }}>{item.isVeg ? '🟢' : '🔴'}</span>
                        <span style={{ fontWeight: item.selectedByMe ? 600 : 400 }}>{item.itemName}</span>
                      </div>
                      {item.selectedByMe && <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>✓ Selected</div>}
                    </button>
                  ))}
                </div>

                {open && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" onClick={() => submitSelection(post)} disabled={saving === post.id}>
                      {saving === post.id ? 'Saving...' : 'Save Selection'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}