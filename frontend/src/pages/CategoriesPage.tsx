import { useEffect, useState, type FormEvent } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = () => {
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => {
    setEditId(null); setName(''); setDescription(''); setError(''); setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c._id); setName(c.name); setDescription(c.description || ''); setError(''); setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, { name, description });
      } else {
        await api.post('/categories', { name, description });
      }
      setShowModal(false); fetch();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); fetch(); }
    catch (err: any) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Categories</h2>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Category</button>
      </div>

      <div className="card">
        {categories.length === 0 ? (
          <div className="empty-state"><p>No categories yet. Create one to get started.</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Name</th><th>Description</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</td>
                    <td>{c.description || '—'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                      <button className="btn-icon" onClick={() => handleDelete(c._id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Category' : 'Add Category'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Electronics" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
