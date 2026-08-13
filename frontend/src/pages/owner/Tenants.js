import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  ACTIVE: 'badge-green', NOTICE_PERIOD: 'badge-yellow', VACATED: 'badge-gray',
  ADVANCE_BOOKED: 'badge-purple', DEFAULTER: 'badge-red'
};

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [advanceBookings, setAdvanceBookings] = useState([]);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) load(r.data.id, filter);
    });
  }, []);

  const load = (pgId, status) => {
    setLoading(true);
    if (status === 'ADVANCE_BOOKED') {
      api.get(`/owner/advance-bookings?pgId=${pgId}`)
        .then(r => setAdvanceBookings(r.data))
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    } else {
      api.get(`/tenants?pgId=${pgId}&status=${status}`)
        .then(r => setTenants(r.data))
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false));
    }
  };

  const handleFilter = (s) => { setFilter(s); if (pg) load(pg.id, s); };

  const filtered = tenants.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.phone.includes(search)
  );

  const filteredAdvance = advanceBookings.filter(ab =>
    ab.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    ab.phone.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{tenants.length} {filter.toLowerCase()} tenants</p>
        </div>
        <Link to="/owner/tenants/add" className="btn btn-primary">+ Add Tenant</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', gap: 4 }}>
          {['ACTIVE', 'NOTICE_PERIOD', 'ADVANCE_BOOKED', 'VACATED', 'DEFAULTER'].map(s => (
            <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => handleFilter(s)} style={{ fontSize: 13, padding: '8px 14px' }}>
              {s.replace('_', ' ')}
            </div>
          ))}
        </div>
        <input className="form-input" placeholder="Search name or phone..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 240, marginLeft: 'auto' }} />
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading"><div className="spinner" /></div> : filter === 'ADVANCE_BOOKED' ? (
          filteredAdvance.length === 0 ? (
            <div className="empty-state"><p>No advance booked tenants found.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Room / Bed</th><th>Expected Join</th>
                    <th>Advance Paid</th><th>Notes</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdvance.map(ab => (
                    <tr key={ab.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ab.tenantName}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{ab.phone}</div>
                      </td>
                      <td>Room {ab.roomNumber}, Bed {ab.bedLabel}<br /><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floor {ab.floorNumber}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(ab.expectedJoin).toLocaleDateString('en-IN')}</td>
                      <td>₹{ab.advancePaid?.toLocaleString()}</td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{ab.notes || '—'}</td>
                      <td><span className="badge badge-purple">ADVANCE BOOKED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="empty-state"><p>No {filter.toLowerCase()} tenants found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th><th>Room / Bed</th><th>Join Date</th>
                  <th>Rent</th><th>This Month</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const bill = t.rentBills?.[0];
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{t.phone}</div>
                      </td>
                      <td>Room {t.bed?.room?.roomNumber}, Bed {t.bed?.bedLabel}<br /><span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floor {t.bed?.room?.floor?.number}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(t.joinDate).toLocaleDateString('en-IN')}</td>
                      <td>₹{t.monthlyRent?.toLocaleString()}</td>
                      <td>
                        {bill ? (
                          <span className={`badge ${bill.status === 'PAID' ? 'badge-green' : bill.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                            {bill.status}
                          </span>
                        ) : <span className="badge badge-gray">No bill</span>}
                      </td>
                      <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{t.status.replace('_', ' ')}</span></td>
                      <td><Link to={`/owner/tenants/${t.id}`} className="btn btn-outline btn-sm">View</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
