import { useEffect, useState, type FormEvent, useRef } from 'react';
import api from '../lib/api';
import { Plus, Pencil, Trash2, Search, X, Camera } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: { _id: string; name: string };
  price: { cost: number; selling: number };
  stock: { current: number; minimum: number };
  unit: string;
  photo?: string;
  isActive: boolean;
}

interface Category {
  _id: string;
  name: string;
}

const defaultForm = {
  name: '', sku: '', barcode: '', category: '',
  costPrice: '', sellingPrice: '', currentStock: '', minimumStock: '', unit: 'pcs',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = () => {
    api.get('/products').then((r) => setProducts(r.data.data.products || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    api.get('/categories').then((r) => setCategories(r.data.data || [])).catch(console.error);
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setSelectedFile(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p._id);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '',
      category: p.category._id, costPrice: String(p.price.cost),
      sellingPrice: String(p.price.selling), currentStock: String(p.stock.current),
      minimumStock: String(p.stock.minimum), unit: p.unit,
    });
    setSelectedFile(null);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('sku', form.sku);
    if (form.barcode) formData.append('barcode', form.barcode);
    formData.append('category', form.category);
    formData.append('unit', form.unit);
    
    // Append nested objects as JSON strings for the backend middleware to parse
    formData.append('price', JSON.stringify({
      cost: Number(form.costPrice),
      selling: Number(form.sellingPrice)
    }));
    formData.append('stock', JSON.stringify({
      current: Number(form.currentStock),
      minimum: Number(form.minimumStock)
    }));

    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    try {
      if (editId) {
        await api.put(`/products/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Products</h2>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Add Product</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 360 }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
        <input className="form-input" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }} />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty-state"><p>No products found</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Cost</th><th>Selling</th><th>Stock</th><th>Unit</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg-input)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {p.photo ? (
                          <img src={p.photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>No Img</span>
                        )}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td><code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                    <td><span className="badge badge-info">{p.category?.name || '—'}</span></td>
                    <td>{formatCurrency(p.price.cost)}</td>
                    <td>{formatCurrency(p.price.selling)}</td>
                    <td>
                      <span className={`badge ${p.stock.current <= p.stock.minimum ? 'badge-danger' : 'badge-success'}`}>
                        {p.stock.current}
                      </span>
                    </td>
                    <td>{p.unit}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={15} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(p._id)} style={{ color: 'var(--accent-danger)' }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editId ? 'Edit Product' : 'Add Product'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              {/* Photo Upload */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div 
                  style={{ 
                    width: 100, height: 100, borderRadius: 8, 
                    border: '2px dashed var(--border-color)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (editId && products.find(p => p._id === editId)?.photo) ? (
                    <img src={products.find(p => p._id === editId)?.photo} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Camera size={24} style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 11 }}>Add Photo</div>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                    style={{ display: 'none' }} 
                    accept="image/jpeg,image/png,image/webp"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required disabled={!!editId} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="">Select…</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Barcode</label>
                  <input className="form-input" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cost Price (₹)</label>
                  <input type="number" className="form-input" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Selling Price (₹)</label>
                  <input type="number" className="form-input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required min="0" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input type="number" className="form-input" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock</label>
                  <input type="number" className="form-input" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} required min="0" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {['pcs', 'kg', 'litre', 'box', 'pack'].map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
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
