import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    state: '',
    pincode: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.errors?.length
          ? err.response.data.errors.map((e: string) => e.replace('body.', '')).join('\n')
          : err.response?.data?.message || 'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="auth-header">
          <div className="auth-logo">IX</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Register your shop to get started</p>
        </div>

        {error && <div className="auth-error" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Shop Name</label>
              <input className="form-input" placeholder="My Electronics" value={form.shopName} onChange={set('shopName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Name</label>
              <input className="form-input" placeholder="John Doe" value={form.ownerName} onChange={set('ownerName')} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Min 8 chars, uppercase, lowercase, number" value={form.password} onChange={set('password')} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" placeholder="Mumbai" value={form.city} onChange={set('city')} required />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input className="form-input" placeholder="Maharashtra" value={form.state} onChange={set('state')} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-input" placeholder="400001" value={form.pincode} onChange={set('pincode')} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating…' : 'Register Shop'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
