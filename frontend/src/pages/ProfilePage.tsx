import { useEffect, useState, useRef, type FormEvent } from 'react';
import api from '../lib/api';
import { Camera, Save, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(user || null);
  const [loading, setLoading] = useState(!user);
  const fileRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Photo
  const [uploading, setUploading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      setProfile(data.data);
      setName(data.data.name);
      setEmail(data.data.email);
    } catch (err: any) {
      console.error(err);
      if (!user) setFetchError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr(''); setSavingProfile(true);
    try {
      const { data } = await api.put('/profile', { name, email });
      setProfile((p: any) => ({ ...p, ...data.data }));
      setProfileMsg('Profile updated successfully');
      // Update localStorage so header reflects changes
      const saved = localStorage.getItem('user');
      if (saved) {
        const u = JSON.parse(saved);
        u.name = data.data.name;
        u.email = data.data.email;
        localStorage.setItem('user', JSON.stringify(u));
      }
    } catch (err: any) {
      setProfileErr(
        err.response?.data?.errors?.length
          ? err.response.data.errors.join(', ')
          : err.response?.data?.message || 'Update failed'
      );
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (newPassword !== confirmPassword) {
      setPwErr('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPwErr('Password must be at least 8 characters');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/profile/password', { currentPassword, newPassword });
      setPwMsg('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setPwErr(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setUploading(true);
    try {
      const { data } = await api.post('/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile((p: any) => ({ ...p, profilePhoto: data.data.profilePhoto }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const initials = profile?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const photoUrl = profile?.profilePhoto
    ? (profile.profilePhoto.startsWith('http') ? profile.profilePhoto : profile.profilePhoto)
    : null;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Profile</h2>
      </div>

      <div className="profile-grid">
        {fetchError && <div className="auth-error" style={{ gridColumn: '1 / -1' }}>{fetchError}</div>}
        {/* Photo + Info Card */}
        <div className="card profile-photo-card">
          <div className="profile-photo-wrapper">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">{initials}</div>
            )}
            <button
              className="profile-photo-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Upload photo"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
          </div>
          {uploading && <p style={{ textAlign: 'center', color: 'var(--accent-primary)', marginTop: 8, fontSize: 13 }}>Uploading…</p>}
          <h3 style={{ textAlign: 'center', marginTop: 12, color: 'var(--text-primary)' }}>{profile?.name}</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{profile?.email}</p>
          <p style={{ textAlign: 'center', marginTop: 4 }}>
            <span className="badge badge-info">{profile?.role?.toUpperCase()}</span>
          </p>
        </div>

        {/* Edit Profile Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><UserIcon size={18} style={{ marginRight: 8 }} /> Edit Profile</h3>
          </div>
          {profileMsg && <div className="auth-success">{profileMsg}</div>}
          {profileErr && <div className="auth-error">{profileErr}</div>}
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <Save size={16} /> {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Lock size={18} style={{ marginRight: 8 }} /> Change Password</h3>
          </div>
          {pwMsg && <div className="auth-success">{pwMsg}</div>}
          {pwErr && <div className="auth-error">{pwErr}</div>}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter new password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              <Lock size={16} /> {savingPw ? 'Changing…' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
