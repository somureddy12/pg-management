import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [pg, setPg] = useState(null);
  const [report, setReport] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  useEffect(() => {
    api.get('/owner/pg').then(r => { setPg(r.data); if (r.data?.id) loadAll(r.data.id, month, year); });
  }, []);

  const loadAll = (pgId, m, y) => {
    setLoading(true);
    Promise.all([
      api.get(`/reports/monthly/${pgId}/${m}/${y}`),
      api.get(`/reports/occupancy/${pgId}`)
    ]).then(([r1, r2]) => { setReport(r1.data); setOccupancy(r2.data); })
      .catch(() => toast.error('Failed to load reports')).finally(() => setLoading(false));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const expenseChartData = report ? Object.entries(report.expenses.byCategory || {}).map(([name, value]) => ({ name, value })) : [];
  const incomeData = report ? [
    { name: 'Rent', value: report.income.rentCollected },
    { name: 'Mess', value: report.income.messCharges },
    { name: 'Late Fees', value: report.income.lateFees },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="form-select" style={{ width: 100 }} value={month} onChange={e => { setMonth(+e.target.value); if (pg) loadAll(pg.id, +e.target.value, year); }}>
            {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="form-select" style={{ width: 90 }} value={year} onChange={e => { setYear(+e.target.value); if (pg) loadAll(pg.id, month, +e.target.value); }}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-light)' }}>💰</div><div><div className="stat-value">₹{((report?.income?.total || 0)/1000).toFixed(1)}k</div><div className="stat-label">Total Income</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--danger-light)' }}>📤</div><div><div className="stat-value">₹{((report?.expenses?.total || 0)/1000).toFixed(1)}k</div><div className="stat-label">Total Expenses</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-light)' }}>📊</div><div><div className="stat-value">₹{((report?.netProfit || 0)/1000).toFixed(1)}k</div><div className="stat-label">Net Profit</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-light)' }}>⏳</div><div><div className="stat-value">₹{((report?.pendingRent || 0)/1000).toFixed(1)}k</div><div className="stat-label">Pending Rent</div></div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Income breakdown */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Income Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomeData}>
              <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} />
              <Tooltip formatter={v => `₹${v?.toLocaleString()}`} />
              <Bar dataKey="value" fill="#4f46e5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense pie */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Expense Breakdown</h3>
          {expenseChartData.length === 0 ? <div className="empty-state"><p>No expenses recorded.</p></div> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expenseChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {expenseChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `₹${v?.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Occupancy by floor */}
      {occupancy && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Occupancy by Floor</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Floor</th><th>Total Beds</th><th>Occupied</th><th>Vacant</th><th>Advance</th><th>Occupancy %</th></tr></thead>
              <tbody>
                {occupancy.floors.map(f => (
                  <tr key={f.floorNumber}>
                    <td>Floor {f.floorNumber}{f.label ? ` — ${f.label}` : ''}</td>
                    <td>{f.total}</td>
                    <td><span className="badge badge-red">{f.occupied}</span></td>
                    <td><span className="badge badge-green">{f.vacant}</span></td>
                    <td><span className="badge badge-purple">{f.advance}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--gray-200)', borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${f.total ? (f.occupied/f.total)*100 : 0}%`, background: 'var(--primary)', height: 8, borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 13 }}>{f.total ? Math.round((f.occupied/f.total)*100) : 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600 }}>
                  <td>Total</td>
                  <td>{occupancy.summary.total}</td>
                  <td>{occupancy.summary.occupied}</td>
                  <td>{occupancy.summary.vacant}</td>
                  <td>{occupancy.summary.advance}</td>
                  <td>{occupancy.summary.total ? Math.round((occupancy.summary.occupied/occupancy.summary.total)*100) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
