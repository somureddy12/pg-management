import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function TenantNotices() {
  const [notices, setNotices] = useState([]);
  const [lostFound, setLostFound] = useState([]);
  const [tab, setTab] = useState('notices');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants/me').then(r => {
      const pgId = r.data?.pgId;
      if (pgId) {
        Promise.all([
          api.get(`/communications/notices/${pgId}`),
          api.get(`/communications/lost-found/${pgId}`)
        ]).then(([n, l]) => { setNotices(n.data); setLostFound(l.data); }).finally(() => setLoading(false));
      } else setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Notices & Lost & Found</h1></div>
      <div className="tabs">
        <div className={`tab ${tab === 'notices' ? 'active' : ''}`} onClick={() => setTab('notices')}>📢 Notices ({notices.length})</div>
        <div className={`tab ${tab === 'lostfound' ? 'active' : ''}`} onClick={() => setTab('lostfound')}>🔍 Lost & Found ({lostFound.length})</div>
      </div>

      {tab === 'notices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notices.length === 0 && <div className="empty-state"><p>No notices yet.</p></div>}
          {notices.map(n => (
            <div key={n.id} className="card" style={{ borderLeft: n.isPinned ? '4px solid var(--primary)' : undefined }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {n.isPinned && <span className="badge badge-blue">📌 Pinned</span>}
                <h4 style={{ fontWeight: 600 }}>{n.title}</h4>
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>{n.body}</p>
              <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'lostfound' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {lostFound.length === 0 && <div className="empty-state"><p>No lost & found items.</p></div>}
          {lostFound.map(item => (
            <div key={item.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <h4 style={{ fontWeight: 600 }}>{item.title}</h4>
                <span className={`badge ${item.status === 'UNCLAIMED' ? 'badge-yellow' : 'badge-green'}`}>{item.status}</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 8 }}>{item.description}</p>
              <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(item.foundDate).toLocaleDateString('en-IN')}</div>
              {item.claimedBy && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>Claimed by: {item.claimedBy}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
