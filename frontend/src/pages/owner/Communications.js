import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const VALID_TABS = ['notices', 'lostfound', 'complaints'];

export default function Communications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = VALID_TABS.includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'notices';
  const [pg, setPg] = useState(null);
  const [notices, setNotices] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) {
        const id = r.data.id;
        api.get(`/communications/notices/${id}`).then(r => setNotices(r.data));
        api.get(`/communications/lost-found/${id}`).then(r => setLostFound(r.data));
        api.get(`/communications/complaints/${id}`).then(r => setComplaints(r.data));
      }
    });
  }, []);

  const reload = () => {
    if (!pg) return;
    api.get(`/communications/notices/${pg.id}`).then(r => setNotices(r.data));
    api.get(`/communications/lost-found/${pg.id}`).then(r => setLostFound(r.data));
    api.get(`/communications/complaints/${pg.id}`).then(r => setComplaints(r.data));
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Communications</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + {tab === 'notices' ? 'Post Notice' : tab === 'lostfound' ? 'Add Item' : ''}
        </button>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'notices' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'notices' })}>📢 Notices ({notices.length})</div>
        <div className={`tab ${tab === 'lostfound' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'lostfound' })}>🔍 Lost & Found ({lostFound.length})</div>
        <div className={`tab ${tab === 'complaints' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'complaints' })}>📝 Complaints ({complaints.filter(c => c.status !== 'RESOLVED').length} open)</div>
      </div>

      {tab === 'notices' && <NoticesTab notices={notices} pgId={pg?.id} onReload={reload} showForm={showForm} onCloseForm={() => setShowForm(false)} />}
      {tab === 'lostfound' && <LostFoundTab items={lostFound} pgId={pg?.id} onReload={reload} showForm={showForm} onCloseForm={() => setShowForm(false)} />}
      {tab === 'complaints' && <ComplaintsTab complaints={complaints} onReload={reload} />}
    </div>
  );
}

function NoticesTab({ notices, pgId, onReload, showForm, onCloseForm }) {
  const [form, setForm] = useState({ title: '', body: '', isPinned: false });
  const [loading, setLoading] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', body: '', isPinned: false });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/communications/notices', { ...form, pgId }); toast.success('Notice posted!'); onReload(); onCloseForm(); setForm({ title: '', body: '', isPinned: false }); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const handleEdit = (notice) => {
    setEditingNotice(notice.id);
    setEditForm({ title: notice.title, body: notice.body, isPinned: notice.isPinned });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.patch(`/communications/notices/${editingNotice}`, editForm); toast.success('Notice updated!'); setEditingNotice(null); onReload(); }
    catch { toast.error('Failed to update'); } finally { setLoading(false); }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await api.delete(`/communications/notices/${id}`); toast.success('Deleted'); onReload();
  };

  const togglePin = async (notice) => {
    await api.patch(`/communications/notices/${notice.id}`, { isPinned: !notice.isPinned }); onReload();
  };

  return (
    <div>
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Post New Notice</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} /> Pin this notice
              </label>
              <button type="button" className="btn btn-outline btn-sm" onClick={onCloseForm}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Posting...' : 'Post'}</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notices.length === 0 && <div className="empty-state"><p>No notices posted yet.</p></div>}
        {notices.map(n => (
          <div key={n.id} className="card" style={{ borderLeft: n.isPinned ? '4px solid var(--primary)' : undefined }}>
            {editingNotice === n.id ? (
              <form onSubmit={handleEditSubmit}>
                <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" value={editForm.body} onChange={e => setEditForm({ ...editForm, body: e.target.value })} required /></div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    <input type="checkbox" checked={editForm.isPinned} onChange={e => setEditForm({ ...editForm, isPinned: e.target.checked })} /> Pin this notice
                  </label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingNotice(null)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {n.isPinned && <span className="badge badge-blue">📌 Pinned</span>}
                    <h4 style={{ fontSize: 15, fontWeight: 600 }}>{n.title}</h4>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>{n.body}</p>
                  <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-outline btn-sm" title="Edit" onClick={() => handleEdit(n)}>✏️</button>
                  <button className="btn btn-outline btn-sm" onClick={() => togglePin(n)}>{n.isPinned ? 'Unpin' : 'Pin'}</button>
                  <button className="btn btn-outline btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => deleteNotice(n.id)}>🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LostFoundTab({ items, pgId, onReload, showForm, onCloseForm }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/communications/lost-found', { ...form, pgId }); toast.success('Item added!'); onReload(); onCloseForm(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };

  const markClaimed = async (id, claimedBy) => {
    await api.patch(`/communications/lost-found/${id}`, { status: 'CLAIMED', claimedBy }); onReload();
  };

  return (
    <div>
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Add Found Item</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Item Name</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onCloseForm}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Adding...' : 'Add Item'}</button>
            </div>
          </form>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.length === 0 && <div className="empty-state"><p>No lost & found items.</p></div>}
        {items.map(item => (
          <div key={item.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 style={{ fontWeight: 600 }}>{item.title}</h4>
              <span className={`badge ${item.status === 'UNCLAIMED' ? 'badge-yellow' : 'badge-green'}`}>{item.status}</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>{item.description}</p>
            <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 10 }}>{new Date(item.foundDate).toLocaleDateString('en-IN')}</div>
            {item.status === 'UNCLAIMED' && (
              <button className="btn btn-success btn-sm" onClick={() => { const name = prompt('Claimed by:'); if (name) markClaimed(item.id, name); }}>Mark Claimed</button>
            )}
            {item.claimedBy && <div style={{ fontSize: 12, color: 'var(--success)' }}>Claimed by: {item.claimedBy}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintsTab({ complaints, onReload }) {
  const STATUS_ORDER = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED'];
  const STATUS_COLORS = { OPEN: 'badge-red', ACKNOWLEDGED: 'badge-yellow', IN_PROGRESS: 'badge-blue', RESOLVED: 'badge-green' };

  const updateStatus = async (id, status) => {
    const resolution = status === 'RESOLVED' ? prompt('Resolution notes:') : undefined;
    await api.patch(`/communications/complaints/${id}`, { status, ...(resolution ? { resolution } : {}) });
    toast.success('Status updated'); onReload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {complaints.length === 0 && <div className="empty-state"><p>No complaints filed.</p></div>}
      {complaints.map(c => (
        <div key={c.id} className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <span className={`badge ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                <span className="badge badge-gray">{c.category}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-700)', marginBottom: 6 }}>{c.description}</p>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {c.tenantName} · Room {c.roomNumber} · {new Date(c.createdAt).toLocaleDateString('en-IN')}
              </div>
              {c.resolution && <div style={{ fontSize: 13, marginTop: 8, padding: 8, background: 'var(--success-light)', borderRadius: 6, color: '#065f46' }}>✅ {c.resolution}</div>}
            </div>
            {c.status !== 'RESOLVED' && (
              <select className="form-select" style={{ width: 160 }} value={c.status} onChange={e => updateStatus(c.id, e.target.value)}>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
