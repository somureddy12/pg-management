import { useState, useEffect } from 'react';
import api from '../../utils/api';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };
const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER'];
const MEAL_ICONS = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };
const MEAL_TIMES = { BREAKFAST: '8am–9am', LUNCH: '1pm–2pm', DINNER: '8pm–9pm' };

export default function TenantMenu() {
  const [menu, setMenu] = useState(null);
  const [pgId, setPgId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants/me').then(r => {
      const id = r.data?.bed?.room?.floor?.pg?.id;
      setPgId(id);
      if (id) api.get(`/menu/current/${id}`).then(m => setMenu(m.data)).finally(() => setLoading(false));
      else setLoading(false);
    });
  }, []);

  const getItems = (day, meal) => menu?.menuItems?.find(i => i.day === day && i.mealType === meal);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const today = ['SUN','MON','TUE','WED','THU','FRI','SAT'][new Date().getDay()];

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Weekly Food Menu</h1></div>
      {!menu ? <div className="empty-state"><p>No menu set for this week. Check back later.</p></div> : (
        <div className="menu-grid">
          {DAYS.map(day => (
            <div key={day} className="menu-day-card" style={{ border: day === today ? '2px solid var(--primary)' : undefined }}>
              <div className="menu-day-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{DAY_LABELS[day]}</span>
                {day === today && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12 }}>Today</span>}
              </div>
              {MEALS.map(meal => {
                const item = getItems(day, meal);
                return (
                  <div key={meal} className="menu-meal">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div className="menu-meal-type">{MEAL_ICONS[meal]} {meal} · {MEAL_TIMES[meal]}</div>
                      {item && <span style={{ fontSize: 11 }}>{item.isVeg ? '🟢' : '🔴'}</span>}
                    </div>
                    <div className="menu-meal-items">{item?.items || <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Not set</span>}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
