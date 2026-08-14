import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SHARING_LABEL = { 1: '1 - Single', 2: '2 - Double', 3: '3 - Triple', 4: '4 - Quadruple' };

export default function Floors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const floorFilter  = searchParams.get('floor')   || '';
  const sharingFilter = searchParams.get('sharing') || '';
  const statusFilter  = searchParams.get('status')  || '';

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'advance' | 'tenant'

  const load = () => {
    api.get('/owner/pg').then(r => setPg(r.data)).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!pg) return <div>Set up your PG first from the dashboard.</div>;

  const getBedStatus = (bed) => {
    if (bed.tenants?.length > 0) return 'occupied';
    if (bed.advanceBookings?.length > 0) return 'advance';
    if (bed.status === 'MAINTENANCE') return 'maintenance';
    return 'vacant';
  };

  const getTenantName = (bed) => {
    if (bed.tenants?.length > 0) return bed.tenants[0].name;
    if (bed.advanceBookings?.length > 0) return `${bed.advanceBookings[0].tenantName} (adv.)`;
    return null;
  };

  const setParam = (key, value) => {
    const next = Object.fromEntries(searchParams.entries());
    if (value) next[key] = value; else delete next[key];
    setSearchParams(next);
  };

  // Unique sharing types across all rooms
  const allSharings = [...new Set(
    pg.floors?.flatMap(f => f.rooms?.map(r => r.sharingType) || []).filter(Boolean)
  )].sort((a, b) => a - b);

  // Apply filters
  const filteredFloors = (pg.floors || [])
    .filter(f => !floorFilter || String(f.number) === floorFilter)
    .map(f => ({
      ...f,
      rooms: (f.rooms || []).filter(r => {
        const matchSharing = !sharingFilter || String(r.sharingType) === sharingFilter;
        const matchStatus = !statusFilter || (() => {
          if (statusFilter === 'vacant') return r.beds.some(b => getBedStatus(b) === 'vacant');
          if (statusFilter === 'full')   return r.beds.every(b => getBedStatus(b) !== 'vacant');
          return true;
        })();
        return matchSharing && matchStatus;
      }),
    }))
    .filter(f => f.rooms.length > 0 || !sharingFilter && !statusFilter);

  const hasFilters = floorFilter || sharingFilter || statusFilter;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Floors & Rooms</h1>
          <p className="page-subtitle">{pg.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddFloor(true)}>+ Add Floor</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-select" value={floorFilter} onChange={e => setParam('floor', e.target.value)}
          style={{ maxWidth: 150, fontSize: 13 }}>
          <option value="">All Floors</option>
          {pg.floors?.map(f => (
            <option key={f.id} value={f.number}>Floor {f.number}{f.label ? ` — ${f.label}` : ''}</option>
          ))}
        </select>
        <select className="form-select" value={sharingFilter} onChange={e => setParam('sharing', e.target.value)}
          style={{ maxWidth: 170, fontSize: 13 }}>
          <option value="">All Sharing</option>
          {allSharings.map(s => (
            <option key={s} value={s}>{SHARING_LABEL[s] || `${s}-Sharing`}</option>
          ))}
        </select>
        <select className="form-select" value={statusFilter} onChange={e => setParam('status', e.target.value)}
          style={{ maxWidth: 160, fontSize: 13 }}>
          <option value="">All Rooms</option>
          <option value="vacant">Has Vacant Beds</option>
          <option value="full">Fully Occupied</option>
        </select>
        {hasFilters && (
          <button className="btn btn-outline btn-sm" onClick={() => setSearchParams({})}>
            Clear Filters ✕
          </button>
        )}
      </div>

      <div className="legend" style={{ marginBottom: 20 }}>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--success)' }} />Vacant (click to book)</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--danger)' }} />Occupied</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--advance)' }} />Advance Booked</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--gray-300)' }} />Maintenance</div>
      </div>

      {pg.floors?.length === 0 && (
        <div className="empty-state"><p>No floors added yet. Click "Add Floor" to get started.</p></div>
      )}

      {filteredFloors.length === 0 && pg.floors?.length > 0 && (
        <div className="empty-state"><p>No rooms match the selected filters.</p></div>
      )}

      {filteredFloors.map(floor => (
        <div key={floor.id} className="floor-section">
          <div className="floor-header">
            <span style={{ fontSize: 16 }}>🏢</span>
            <span className="floor-title">Floor {floor.number}{floor.label ? ` — ${floor.label}` : ''}</span>
            <div className="floor-stats">
              <span className="floor-stat">🛏️ {floor.rooms?.reduce((s, r) => s + r.beds.length, 0)} beds</span>
              <span className="floor-stat" style={{ color: '#86efac' }}>✅ {floor.rooms?.reduce((s, r) => s + r.beds.filter(b => getBedStatus(b) === 'vacant').length, 0)} vacant</span>
            </div>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowAddRoom(floor.id)}>+ Add Room</button>
          </div>
          <div className="room-grid">
            {floor.rooms?.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <div>
                    <div className="room-number">Room {room.roomNumber}</div>
                    <div className="room-type">{room.sharingType} Sharing · ₹{room.monthlyRent}/mo</div>
                  </div>
                  <span className="badge badge-blue">{room.beds.filter(b => getBedStatus(b) === 'occupied').length}/{room.beds.length}</span>
                </div>
                <div className="bed-grid">
                  {room.beds.map(bed => {
                    const status = getBedStatus(bed);
                    const name = getTenantName(bed);
                    return (
                      <div key={bed.id} className={`bed-card ${status}`}
                        onClick={() => { if (status === 'vacant') { setSelectedBed({ ...bed, room }); setBookingType('choose'); } }}
                        title={status === 'occupied' ? name : status === 'advance' ? `Advance: ${name}` : 'Click to book'}>
                        <div style={{ fontSize: 18 }}>{status === 'vacant' ? '🟢' : status === 'occupied' ? '🔴' : status === 'advance' ? '🟡' : '🔧'}</div>
                        <div className="bed-label">Bed {bed.bedLabel}</div>
                        {name && <div className="bed-tenant" style={{ fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {floor.rooms?.length === 0 && <div style={{ color: 'var(--gray-400)', fontSize: 13, padding: '20px' }}>No rooms on this floor yet.</div>}
          </div>
        </div>
      ))}

      {showAddFloor && <AddFloorModal pgId={pg.id} onClose={() => setShowAddFloor(false)} onSaved={load} />}
      {showAddRoom && <AddRoomModal floorId={showAddRoom} onClose={() => setShowAddRoom(null)} onSaved={load} />}
      {selectedBed && bookingType === 'choose' && (
        <ChooseBookingModal bed={selectedBed}
          onAdvance={() => setBookingType('advance')}
          onTenant={() => { window.location.href = `/owner/tenants/add?bedId=${selectedBed.id}`; }}
          onClose={() => { setSelectedBed(null); setBookingType(null); }} />
      )}
      {selectedBed && bookingType === 'advance' && (
        <AdvanceBookingModal bed={selectedBed} onClose={() => { setSelectedBed(null); setBookingType(null); }} onSaved={load} />
      )}
    </div>
  );
}

function ChooseBookingModal({ bed, onAdvance, onTenant, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h3 className="modal-title">Book Bed {bed.bedLabel} — Room {bed.room.roomNumber}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px' }} onClick={onTenant}>
            👤 Add New Tenant Now
          </button>
          <button className="btn btn-outline" style={{ justifyContent: 'center', padding: '14px' }} onClick={onAdvance}>
            📅 Advance Booking (future join)
          </button>
        </div>
      </div>
    </div>
  );
}

function AddFloorModal({ pgId, onClose, onSaved }) {
  const [form, setForm] = useState({ number: '', label: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await api.post('/owner/floor', { pgId, number: parseInt(form.number), label: form.label }); toast.success('Floor added'); onSaved(); onClose(); }
    catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">Add Floor</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Floor Number</label><input className="form-input" type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Label (optional)</label><input className="form-input" placeholder="e.g. Ground Floor" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Floor'}</button></div>
        </form>
      </div>
    </div>
  );
}

function AddRoomModal({ floorId, onClose, onSaved }) {
  const [form, setForm] = useState({ roomNumber: '', sharingType: 2, monthlyRent: '', amenities: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/rooms', { floorId, roomNumber: form.roomNumber, sharingType: parseInt(form.sharingType), monthlyRent: parseFloat(form.monthlyRent), amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean) });
      toast.success('Room added'); onSaved(); onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">Add Room</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Room Number</label><input className="form-input" placeholder="e.g. 101" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Sharing Type</label>
                <select className="form-select" value={form.sharingType} onChange={e => setForm({ ...form, sharingType: e.target.value })}>
                  <option value={1}>Single</option><option value={2}>Double</option><option value={3}>Triple</option><option value={4}>Four Sharing</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Monthly Rent (₹)</label><input className="form-input" type="number" value={form.monthlyRent} onChange={e => setForm({ ...form, monthlyRent: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Amenities (comma separated)</label><input className="form-input" placeholder="AC, WiFi, Attached Bath" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={loading}>{loading ? 'Adding...' : 'Add Room'}</button></div>
        </form>
      </div>
    </div>
  );
}

function AdvanceBookingModal({ bed, onClose, onSaved }) {
  const [form, setForm] = useState({ tenantName: '', phone: '', expectedJoin: '', advancePaid: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/owner/advance-booking', { bedId: bed.id, ...form, advancePaid: parseFloat(form.advancePaid) || 0 });
      toast.success('Advance booking confirmed'); onSaved(); onClose();
    } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h3 className="modal-title">Advance Booking — Bed {bed.bedLabel}</h3><button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Tenant Name</label><input className="form-input" value={form.tenantName} onChange={e => setForm({ ...form, tenantName: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Expected Join Date</label><input className="form-input" type="date" value={form.expectedJoin} onChange={e => setForm({ ...form, expectedJoin: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Advance Paid (₹)</label><input className="form-input" type="number" value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={loading}>{loading ? 'Booking...' : 'Confirm Booking'}</button></div>
        </form>
      </div>
    </div>
  );
}
