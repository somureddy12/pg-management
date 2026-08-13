import { useState } from 'react';

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 80;

function ClockFace({ items, selected, onSelect }) {
  const selectedIdx = items.findIndex(i => i.value === selected);
  const angleRad = selectedIdx >= 0
    ? (selectedIdx * (360 / items.length) - 90) * (Math.PI / 180)
    : null;
  const handX = angleRad !== null ? CENTER + (RADIUS - 12) * Math.cos(angleRad) : CENTER;
  const handY = angleRad !== null ? CENTER + (RADIUS - 12) * Math.sin(angleRad) : CENTER;

  return (
    <svg width={SIZE} height={SIZE}>
      <circle cx={CENTER} cy={CENTER} r={CENTER - 4} fill="#f5f3ff" stroke="#7c3aed" strokeWidth="2" />
      {angleRad !== null && (
        <line x1={CENTER} y1={CENTER} x2={handX} y2={handY}
          stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
      )}
      <circle cx={CENTER} cy={CENTER} r={5} fill="#7c3aed" />
      {items.map((item, i) => {
        const angle = (i * (360 / items.length) - 90) * (Math.PI / 180);
        const x = CENTER + RADIUS * Math.cos(angle);
        const y = CENTER + RADIUS * Math.sin(angle);
        const isSel = item.value === selected;
        return (
          <g key={item.value} onClick={() => onSelect(item.value)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy={y} r={17} fill={isSel ? '#7c3aed' : 'transparent'}
              onMouseEnter={e => !isSel && (e.target.style.fill = '#ede9fe')}
              onMouseLeave={e => !isSel && (e.target.style.fill = 'transparent')} />
            <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fill={isSel ? '#fff' : '#374151'} fontSize="12"
              fontWeight={isSel ? '700' : '400'} style={{ pointerEvents: 'none' }}>
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ClockTimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('hour');

  const [h24, m] = value ? value.split(':').map(Number) : [9, 0];
  const isPM = h24 >= 12;
  const h12 = h24 % 12 || 12;

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => ({ value: h, label: String(h) }));
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(mn => ({
    value: mn, label: mn.toString().padStart(2, '0')
  }));

  const updateTime = (newH24, newM) =>
    onChange(`${newH24.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`);

  const handleHourSelect = (h) => {
    const h24new = isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    updateTime(h24new, m);
    setMode('minute');
  };

  const handleMinuteSelect = (mn) => {
    updateTime(h24, mn);
    setOpen(false);
    setMode('hour');
  };

  const toggleAMPM = (newIsPM) => {
    const newH24 = newIsPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    updateTime(newH24, m);
  };

  const displayTime = value
    ? `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
    : 'Set time';

  return (
    <div style={{ position: 'relative' }}>
      {label && <label className="form-label">{label}</label>}
      <button type="button" onClick={() => { setOpen(!open); setMode('hour'); }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff',
          cursor: 'pointer', fontSize: 14, width: '100%', color: value ? '#111' : 'var(--gray-400)' }}>
        <span>🕐</span> {displayTime}
      </button>

      {open && (
        <div style={{ position: 'absolute', zIndex: 200, background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 20, top: 'calc(100% + 6px)',
          left: 0, minWidth: 260 }}>

          {/* Digital display */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 14 }}>
            <span onClick={() => setMode('hour')} style={{ fontSize: 30, fontWeight: 700, cursor: 'pointer',
              color: mode === 'hour' ? '#7c3aed' : '#111',
              background: mode === 'hour' ? '#f5f3ff' : 'transparent',
              borderRadius: 8, padding: '2px 10px' }}>
              {h12.toString().padStart(2, '0')}
            </span>
            <span style={{ fontSize: 30, fontWeight: 700, color: '#111' }}>:</span>
            <span onClick={() => setMode('minute')} style={{ fontSize: 30, fontWeight: 700, cursor: 'pointer',
              color: mode === 'minute' ? '#7c3aed' : '#111',
              background: mode === 'minute' ? '#f5f3ff' : 'transparent',
              borderRadius: 8, padding: '2px 10px' }}>
              {m.toString().padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 8 }}>
              {['AM', 'PM'].map(ap => (
                <button key={ap} type="button" onClick={() => toggleAMPM(ap === 'PM')}
                  style={{ fontSize: 12, fontWeight: (ap === 'PM') === isPM ? 700 : 400,
                    color: (ap === 'PM') === isPM ? '#7c3aed' : '#9ca3af',
                    background: (ap === 'PM') === isPM ? '#f5f3ff' : 'transparent',
                    border: 'none', cursor: 'pointer', borderRadius: 4, padding: '3px 8px' }}>
                  {ap}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ClockFace
              items={mode === 'hour' ? hours : minutes}
              selected={mode === 'hour' ? h12 : m}
              onSelect={mode === 'hour' ? handleHourSelect : handleMinuteSelect}
            />
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            {mode === 'hour' ? 'Tap an hour' : 'Tap a minute'}
          </div>
        </div>
      )}
    </div>
  );
}