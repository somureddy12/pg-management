import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  ACTIVE: 'badge-green', NOTICE_PERIOD: 'badge-yellow', VACATED: 'badge-gray',
  ADVANCE_BOOKED: 'badge-purple', DEFAULTER: 'badge-red'
};

const VALID_STATUSES = ['ACTIVE', 'NOTICE_PERIOD', 'ADVANCE_BOOKED', 'VACATED', 'DEFAULTER'];

const SHARING_LABEL = { 1: 'Single', 2: 'Double', 3: 'Triple', 4: 'Quadruple' };

export default function Tenants() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = VALID_STATUSES.includes(searchParams.get('status'))
    ? searchParams.get('status') : 'ACTIVE';
  const floorFilter = searchParams.get('floor') || '';
  const sharingFilter = searchParams.get('sharing') || '';

  const [tenants, setTenants] = useState([]);
  const [advanceBookings, setAdvanceBookings] = useState([]);
  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) load(r.data.id, filter);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pg?.id) load(pg.id, filter);
  }, [filter]);

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

  const setParam = (key, value) => {
    const next = Object.fromEntries(searchParams.entries());
    if (value) next[key] = value; else delete next[key];
    setSearchParams(next);
  };

  const handleFilter = (s) => {
    setSearchParams({ status: s });
  };

  // Derive unique floor & sharing options from loaded tenants
  const floors = [...new Set(tenants.map(t => t.floorNumber).filter(Boolean))].sort((a, b) => a - b);
  const sharings = [...new Set(tenants.map(t => t.sharingType).filter(Boolean))].sort((a, b) => a - b);

  const filtered = tenants.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.phone.includes(search);
    const matchFloor = !floorFilter || String(t.floorNumber) === floorFilter;
    const matchSharing = !sharingFilter || String(t.sharingType) === sharingFilter;
    return matchSearch && matchFloor && matchSharing;
  });

  const filteredAdvance = advanceBookings.filter(ab =>
    ab.tenantName.toLowerCase().includes(search.toLowerCase()) ||
    ab.phone.includes(search)
  );

  const hasExtraFilters = floorFilter || sharingFilter;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{filtered.length} {filter.toLowerCase().replace('_', ' ')} tenants</p>
        </div>
        <Link to="/owner/tenants/add" className="btn btn-primary">+ Add Tenant</Link>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', gap: 4 }}>
          {['ACTIVE', 'NOTICE_PERIOD', 'ADVANCE_BOOKED', 'VACATED', 'DEFAULTER'].map(s => (
            <div key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => handleFilter(s)}
              style={{ fontSize: 13, padding: '8px 14px' }}>
              {s.replace('_', ' ')}
            </div>
          ))}
        </div>
        <input className="form-input" placeholder="Search name or phone..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220, marginLeft: 'auto' }} />
      </div>

      {/* Secondary filters — floor & sharing */}
      {filter !== 'ADVANCE_BOOKED' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="form-select" value={floorFilter} onChange={e => setParam('floor', e.target.value)}
            style={{ maxWidth: 150, fontSize: 13 }}>
            <option value="">All Floors</option>
            {floors.map(f => <option key={f} value={f}>Floor {f}</option>)}
          </select>
          <select className="form-select" value={sharingFilter} onChange={e => setParam('sharing', e.target.value)}
            style={{ maxWidth: 160, fontSize: 13 }}>
            <option value="">All Sharing</option>
            {sharings.map(s => (
              <option key={s} value={s}>{SHARING_LABEL[s] || `${s}-Sharing`}</option>
            ))}
          </select>
          {hasExtraFilters && (
            <button className="btn btn-outline btn-sm" onClick={() => {
              const next = Object.fromEntries(searchParams.entries());
              delete next.floor; delete next.sharing;
              setSearchParams(next);
            }}>
              Clear Filters ✕
            </button>
          )}
        </div>
      )}

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
                      <td>Room {ab.roomNumber}, Bed {ab.bedLabel}<br />
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floor {ab.floorNumber}</span>
                      </td>
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
          <div className="empty-state"><p>No tenants match the selected filters.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tenant</th><th>Room / Bed</th><th>Sharing</th><th>Join Date</th>
                  {filter === 'VACATED'
                    ? <th>Vacated On</th>
                    : <><th>Rent</th><th>This Month</th></>
                  }
                  <th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const bill = t.latestBill;
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{t.phone}</div>
                      </td>
                      <td>
                        Room {t.roomNumber}, Bed {t.bedLabel}
                        <br />
                        <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>Floor {t.floorNumber}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {t.sharingType ? (SHARING_LABEL[t.sharingType] || `${t.sharingType}-Sharing`) : '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>{new Date(t.joinDate).toLocaleDateString('en-IN')}</td>
                      {filter === 'VACATED' ? (
                        <td style={{ fontSize: 13 }}>
                          {t.actualVacate ? new Date(t.actualVacate).toLocaleDateString('en-IN') : '—'}
                        </td>
                      ) : (
                        <>
                          <td>₹{t.monthlyRent?.toLocaleString()}</td>
                          <td>
                            {bill ? (
                              <span className={`badge ${bill.status === 'PAID' ? 'badge-green' : bill.status === 'PARTIAL' ? 'badge-yellow' : 'badge-red'}`}>
                                {bill.status}
                              </span>
                            ) : <span className="badge badge-gray">No bill</span>}
                          </td>
                        </>
                      )}
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
