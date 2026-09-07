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
  const [editRoom, setEditRoom] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'room'|'floor', id, label }

  const handleDeleteRoom = async (roomId) => {
    try { await api.delete(`/rooms/${roomId}`); toast.success('Room deleted'); load(); }
    catch { toast.error('Cannot delete room with active tenants'); }
    setConfirmDelete(null);
  };

  const handleDeleteFloor = async (floorId) => {
    try { await api.delete(`/owner/floor/${floorId}`); toast.success('Floor deleted'); load(); }
    catch (err) { toast.error(err?.response?.data?.message || 'Cannot delete floor with active tenants'); }
    setConfirmDelete(null);
  };

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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddRoom(floor.id)}>+ Add Room</button>
              <button
                className="btn btn-sm btn-outline"
                title="Delete floor"
                onClick={() => setConfirmDelete({ type: 'floor', id: floor.id, label: `Floor ${floor.number}${floor.label ? ` — ${floor.label}` : ''}` })}
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                🗑️ Delete Floor
              </button>
            </div>
          </div>
          <div className="room-grid">
            {[...(floor.rooms || [])].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })).map(room => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <div>
                    <div className="room-number">Room {room.roomNumber}</div>
                    <div className="room-type">{room.sharingType} Sharing · ₹{room.monthlyRent}/mo</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-blue">{room.beds.filter(b => getBedStatus(b) === 'occupied').length}/{room.beds.length}</span>
                    <button
                      className="btn btn-sm btn-outline"
                      title="Edit room & beds"
                      onClick={e => { e.stopPropagation(); setEditRoom(room); }}
                      style={{ padding: '4px 8px', lineHeight: 1 }}>
                      ✏️
                    </button>
                    <button
                      className="btn btn-sm btn-outline"
                      title="Delete room"
                      onClick={e => { e.stopPropagation(); setConfirmDelete({ type: 'room', id: room.id, label: `Room ${room.roomNumber}` }); }}
                      style={{ padding: '4px 8px', lineHeight: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                      🗑️
                    </button>
                  </div>
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
      {editRoom && <EditRoomModal room={editRoom} onDone={() => { setEditRoom(null); load(); }} />}
      {confirmDelete && (
        <ConfirmDeleteModal
          label={confirmDelete.label}
          onConfirm={() => confirmDelete.type === 'room' ? handleDeleteRoom(confirmDelete.id) : handleDeleteFloor(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)} />
      )}
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

function ConfirmDeleteModal({ label, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <h3 className="modal-title">Delete {label}?</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--gray-600)', margin: 0 }}>This action cannot be undone. Rooms or beds with active tenants cannot be deleted.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function EditRoomModal({ room, onDone }) {
  const [form, setForm] = useState({
    roomNumber: room.roomNumber || '',
    sharingType: room.sharingType || 2,
    monthlyRent: room.monthlyRent || '',
    amenities: room.amenities || '',
  });
  const [beds, setBeds] = useState(room.beds.map(b => ({ ...b, label: b.bedLabel })));
  const [loading, setLoading] = useState(false);
  const [bedLoading, setBedLoading] = useState({});
  const [confirmBedDelete, setConfirmBedDelete] = useState(null);
  const [sharingError, setSharingError] = useState('');

  const occupiedCount = beds.filter(b =>
    (b.tenants?.length > 0) || (b.advanceBookings?.length > 0)
  ).length;

  const validateSharing = (value) => {
    const n = parseInt(value);
    if (occupiedCount > 0 && n < occupiedCount) {
      setSharingError(`Cannot reduce to ${n} — ${occupiedCount} bed${occupiedCount > 1 ? 's are' : ' is'} currently occupied`);
    } else {
      setSharingError('');
    }
  };

  const saveRoom = async (e) => {
    e.preventDefault();
    const newSharing = parseInt(form.sharingType);
    if (occupiedCount > 0 && newSharing < occupiedCount) {
      toast.error(`Cannot set sharing to ${newSharing} — ${occupiedCount} bed${occupiedCount > 1 ? 's are' : ' is'} occupied`);
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/rooms/${room.id}`, {
        roomNumber: form.roomNumber,
        sharingType: newSharing,
        monthlyRent: parseFloat(form.monthlyRent),
        amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean),
      });
      toast.success('Room updated');
      onDone();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update room');
    } finally { setLoading(false); }
  };

  const saveBed = async (bed) => {
    setBedLoading(p => ({ ...p, [bed.id]: true }));
    try {
      await api.patch(`/rooms/beds/${bed.id}`, { bedLabel: bed.label, status: bed.status });
      toast.success(`Bed ${bed.label} updated`);
    } catch { toast.error('Failed to update bed'); }
    finally { setBedLoading(p => ({ ...p, [bed.id]: false })); }
  };

  const deleteBed = async (bedId) => {
    setBedLoading(p => ({ ...p, [bedId]: true }));
    try {
      await api.delete(`/rooms/beds/${bedId}`);
      setBeds(prev => prev.filter(b => b.id !== bedId));
      toast.success('Bed deleted');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cannot delete occupied bed');
    } finally {
      setBedLoading(p => ({ ...p, [bedId]: false }));
      setConfirmBedDelete(null);
    }
  };

  const isOccupied = (bed) => bed.tenants?.length > 0 || bed.advanceBookings?.length > 0;
  const statusColor = { VACANT: 'var(--success)', OCCUPIED: 'var(--danger)', MAINTENANCE: 'var(--gray-400)', ADVANCE_BOOKED: 'var(--advance)' };

  return (
    <div className="modal-overlay" onClick={onDone}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3 className="modal-title">Edit Room {room.roomNumber}</h3>
          <button onClick={onDone} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={saveRoom}>
          <div className="modal-body">
            <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--gray-700)' }}>Room Details</p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Room Number</label>
                <input className="form-input" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sharing Type</label>
                <select
                  className="form-select"
                  value={form.sharingType}
                  onChange={e => { setForm({ ...form, sharingType: e.target.value }); validateSharing(e.target.value); }}
                  style={{ borderColor: sharingError ? 'var(--danger)' : undefined }}>
                  <option value={1}>Single</option>
                  <option value={2}>Double</option>
                  <option value={3}>Triple</option>
                  <option value={4}>Four Sharing</option>
                </select>
                {sharingError && <p style={{ color: 'var(--danger)', fontSize: 12, margin: '4px 0 0' }}>{sharingError}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Rent (₹)</label>
              <input className="form-input" type="number" value={form.monthlyRent} onChange={e => setForm({ ...form, monthlyRent: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Amenities (comma separated)</label>
              <input className="form-input" placeholder="AC, WiFi, Attached Bath" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
            </div>

            <p style={{ fontWeight: 600, margin: '16px 0 8px', color: 'var(--gray-700)' }}>Beds</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {beds.map(bed => (
                <div key={bed.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor[bed.status] || 'var(--gray-300)', flexShrink: 0 }} />
                  <input
                    className="form-input"
                    style={{ width: 80, padding: '4px 8px', fontSize: 13 }}
                    value={bed.label}
                    onChange={e => setBeds(prev => prev.map(b => b.id === bed.id ? { ...b, label: e.target.value } : b))}
                  />
                  <span style={{ fontSize: 12, color: 'var(--gray-500)', flex: 1 }}>
                    {bed.tenants?.[0]?.name || bed.advanceBookings?.[0]?.tenantName || bed.status}
                  </span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={bed.status === 'MAINTENANCE'}
                      disabled={isOccupied(bed)}
                      onChange={e => setBeds(prev => prev.map(b => b.id === bed.id ? { ...b, status: e.target.checked ? 'MAINTENANCE' : 'VACANT' } : b))}
                    />
                    Maintenance
                  </label>
                  <button type="button" className="btn btn-sm btn-outline" disabled={bedLoading[bed.id]}
                    onClick={() => saveBed(bed)} style={{ padding: '4px 10px', fontSize: 12 }}>
                    {bedLoading[bed.id] ? '...' : 'Save'}
                  </button>
                  <button type="button" disabled={isOccupied(bed) || bedLoading[bed.id]}
                    onClick={() => setConfirmBedDelete(bed)}
                    title={isOccupied(bed) ? 'Cannot delete occupied bed' : 'Delete bed'}
                    style={{ background: 'none', border: 'none', cursor: isOccupied(bed) ? 'not-allowed' : 'pointer', fontSize: 16, opacity: isOccupied(bed) ? 0.3 : 1, padding: '2px 4px' }}>
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onDone}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !!sharingError}>
              {loading ? 'Saving...' : 'Save Room'}
            </button>
          </div>
        </form>

        {confirmBedDelete && (
          <div className="modal-overlay" onClick={() => setConfirmBedDelete(null)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
              <div className="modal-header">
                <h3 className="modal-title">Delete Bed {confirmBedDelete.label}?</h3>
                <button onClick={() => setConfirmBedDelete(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
              </div>
              <div className="modal-body"><p style={{ color: 'var(--gray-600)', margin: 0 }}>This cannot be undone.</p></div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setConfirmBedDelete(null)}>Cancel</button>
                <button className="btn btn-danger" disabled={bedLoading[confirmBedDelete.id]} onClick={() => deleteBed(confirmBedDelete.id)}>
                  {bedLoading[confirmBedDelete.id] ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
