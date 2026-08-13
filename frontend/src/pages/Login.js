import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole] = useState('owner');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password, role);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(role === 'owner' ? '/owner' : '/tenant');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🏠 PG Manager</h1>
          <p>Manage your paying guest property</p>
        </div>

        <div className="tabs" style={{ marginBottom: 24 }}>
          <div className={`tab ${role === 'owner' ? 'active' : ''}`} onClick={() => setRole('owner')}>Owner</div>
          <div className={`tab ${role === 'tenant' ? 'active' : ''}`} onClick={() => setRole('tenant')}>Tenant</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{role === 'owner' ? 'Email' : 'Phone Number'}</label>
            <input className="form-input" type={role === 'owner' ? 'email' : 'tel'} placeholder={role === 'owner' ? 'owner@email.com' : '9876543210'}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {role === 'owner' && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--gray-500)' }}>
            New owner? <Link to="/register" style={{ color: 'var(--primary)' }}>Create account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
