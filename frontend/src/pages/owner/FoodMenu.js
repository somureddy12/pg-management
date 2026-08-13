import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday' };
const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER'];
const MEAL_ICONS = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙' };
const MEAL_TIMES = { BREAKFAST: '8am–9am', LUNCH: '1pm–2pm', DINNER: '8pm–9pm' };

export default function FoodMenu() {
  const [pg, setPg] = useState(null);
  const [menu, setMenu] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [menuData, setMenuData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/owner/pg').then(r => {
      setPg(r.data);
      if (r.data?.id) loadMenu(r.data.id);
    });
  }, []);

  const loadMenu = (pgId) => {
    api.get(`/menu/current/${pgId}`).then(r => {
      setMenu(r.data);
      if (r.data) {
        const data = {};
        r.data.menuItems.forEach(item => {
          if (!data[item.day]) data[item.day] = {};
          data[item.day][item.mealType] = { items: item.items, isVeg: item.isVeg };
        });
        setMenuData(data);
      } else {
        // Initialize empty
        const empty = {};
        DAYS.forEach(d => { empty[d] = {}; MEALS.forEach(m => { empty[d][m] = { items: '', isVeg: true }; }); });
        setMenuData(empty);
      }
    }).finally(() => setLoading(false));
  };

  const saveMenu = async () => {
    if (!pg) return;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);

    const menuItems = [];
    DAYS.forEach(day => {
      MEALS.forEach(mealType => {
        const item = menuData[day]?.[mealType];
        if (item?.items) menuItems.push({ day, mealType, items: item.items, isVeg: item.isVeg, timing: MEAL_TIMES[mealType] });
      });
    });

    try {
      await api.post('/menu', { pgId: pg.id, weekStartDate: weekStart.toISOString(), menuItems });
      toast.success('Menu saved!'); setEditMode(false); loadMenu(pg.id);
    } catch { toast.error('Failed to save menu'); }
  };

  const updateItem = (day, meal, field, value) => {
    setMenuData(prev => ({ ...prev, [day]: { ...prev[day], [meal]: { ...prev[day]?.[meal], [field]: value } } }));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Food Menu</h1><p className="page-subtitle">Weekly meal schedule</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          {editMode ? (
            <>
              <button className="btn btn-outline" onClick={() => setEditMode(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveMenu}>Save Menu</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setEditMode(true)}>✏️ Edit Menu</button>
          )}
        </div>
      </div>

      <div className="menu-grid">
        {DAYS.map(day => (
          <div key={day} className="menu-day-card">
            <div className="menu-day-header">{DAY_LABELS[day]}</div>
            {MEALS.map(meal => (
              <div key={meal} className="menu-meal">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="menu-meal-type">{MEAL_ICONS[meal]} {meal} · {MEAL_TIMES[meal]}</div>
                  {editMode && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
                      <input type="checkbox" checked={menuData[day]?.[meal]?.isVeg ?? true}
                        onChange={e => updateItem(day, meal, 'isVeg', e.target.checked)} />
                      Veg
                    </label>
                  )}
                  {!editMode && <span style={{ fontSize: 11 }}>{menuData[day]?.[meal]?.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>}
                </div>
                {editMode ? (
                  <input className="form-input" style={{ marginTop: 6, fontSize: 13 }}
                    placeholder="e.g. Dal, Rice, Roti"
                    value={menuData[day]?.[meal]?.items || ''}
                    onChange={e => updateItem(day, meal, 'items', e.target.value)} />
                ) : (
                  <div className="menu-meal-items">{menuData[day]?.[meal]?.items || <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Not set</span>}</div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
