import { useEffect, useState, type FormEvent } from 'react';
import api from '../lib/api';
import { Plus, X, ShoppingCart, Printer, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SaleItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  _id: string;
  invoiceNumber: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  createdBy: { name: string };
  createdAt: string;
}

interface Product {
  _id: string;
  name: string;
  price: { selling: number };
  stock: { current: number };
}

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Sale | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountGiven, setAmountGiven] = useState('');
  
  // Ref for the printable invoice area (though we use CSS media print class)
  const [printSale, setPrintSale] = useState<Sale | null>(null);

  const fetchSales = () => {
    api.get('/sales').then((r) => setSales(r.data.data.sales || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
    api.get('/products').then((r) => setProducts(r.data.data.products || [])).catch(console.error);
  }, []);

  const addToCart = () => setCart([...cart, { productId: '', quantity: 1 }]);
  const removeFromCart = (i: number) => setCart(cart.filter((_, idx) => idx !== i));
  const updateCart = (i: number, field: string, value: string) => {
    const updated = [...cart];
    (updated[i] as any)[field] = field === 'quantity' ? Number(value) : value;
    setCart(updated);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      const prod = products.find((p) => p._id === item.productId);
      return sum + (prod ? prod.price.selling * item.quantity : 0);
    }, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const { data } = await api.post('/sales', {
        items: cart.map((c) => ({ product: c.productId, quantity: c.quantity })),
        paymentMethod,
      });
      setShowModal(false);
      setCart([]);
      setPaymentMethod('cash');
      setAmountGiven('');
      fetchSales();
      api.get('/products').then((r) => setProducts(r.data.data.products || []));
      
      // Auto-open detail modal for the new sale to allow immediate printing
      // The API returns the created sale, let's use it
      if (data.data) {
        setShowDetail(data.data as Sale);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record sale');
    } finally { setSaving(false); }
  };

  const handlePrint = (sale: Sale) => {
    setPrintSale(sale);
    // Wait for state update to render the printable area
    setTimeout(() => {
      window.print();
      // Clear print sale after printing to reset (optional, but good for cleanup)
      // setPrintSale(null); // Actually, keep it so if they print again it works, or let it stick.
    }, 100);
  };

  const handleShare = async (sale: Sale) => {
    const text = `INVOICE #${sale.invoiceNumber}
Shop: ${user?.shopName || 'INVENTRIX'}
Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}
Total: ₹${sale.totalAmount.toLocaleString('en-IN')}

Items:
${sale.items.map((i) => `- ${i.name} x${i.quantity} (₹${i.total})`).join('\n')}

Thank you for your business!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${sale.invoiceNumber}`, text });
        return;
      } catch (err) { /* ignore share cancel */ }
    }
    // Fallback: WhatsApp
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div>
      {/* Printable Invoice (Visible only when printing) */}
      {printSale && (
        <div className="printable-invoice">
          <div className="invoice-header">
            <div>
              <div className="invoice-brand">{user?.shopName?.toUpperCase() || 'INVENTRIX'}</div>
              <div style={{ color: '#666', marginTop: 4 }}>Inventory Management System</div>
              <div style={{ marginTop: 12 }}>
                <strong>Billed To:</strong><br />
                Walk-in Customer
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>INVOICE</h2>
              <div style={{ marginTop: 8 }}>#{printSale.invoiceNumber}</div>
              <div>{new Date(printSale.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {printSale.items.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ width: 250 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(printSale.totalAmount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Tax (0%):</span>
                <span>₹0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '2px solid #ddd', paddingTop: 8 }}>
                <span>Total:</span>
                <span>{formatCurrency(printSale.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 60, textAlign: 'center', color: '#666', fontSize: 12 }}>
            <p>Thank you for your business!</p>
            <p style={{ marginTop: 4 }}>Authorized Signature</p>
          </div>
        </div>
      )}

      {/* Screen Content */}
      <div className="page-header">
        <h2 className="page-title">Sales</h2>
        <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setCart([{ productId: '', quantity: 1 }]); }}>
          <Plus size={18} /> New Sale
        </button>
      </div>

      <div className="card">
        {sales.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} />
            <p>No sales recorded yet</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Invoice</th><th>Items</th><th>Total</th><th>Payment</th><th>Seller</th><th>Date</th></tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} onClick={() => { setShowDetail(s); setPrintSale(s); }} style={{ cursor: 'pointer' }}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.invoiceNumber}</td>
                    <td>{s.items.length} item{s.items.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(s.totalAmount)}</td>
                    <td><span className="badge badge-info">{s.paymentMethod.toUpperCase()}</span></td>
                    <td>{s.createdBy?.name || '—'}</td>
                    <td>{new Date(s.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{showDetail.invoiceNumber}</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleShare(showDetail)}>
                  <Share2 size={16} /> Share
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handlePrint(showDetail)}>
                  <Printer size={16} /> Print Invoice
                </button>
                <button className="btn-icon" onClick={() => setShowDetail(null)}><X size={18} /></button>
              </div>
            </div>
            <table style={{ marginBottom: 16 }}>
              <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
              <tbody>
                {showDetail.items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-primary)' }}>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border-color)' }}>
              <span className="badge badge-info">{showDetail.paymentMethod.toUpperCase()}</span>
              <span style={{ fontSize: 20, fontWeight: 800 }}>{formatCurrency(showDetail.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Sale</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            {error && <div className="auth-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    {i === 0 && <label className="form-label">Product</label>}
                    <select className="form-select" value={item.productId} onChange={(e) => updateCart(i, 'productId', e.target.value)} required>
                      <option value="">Select…</option>
                      {products.map((p) => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock.current})</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    {i === 0 && <label className="form-label">Qty</label>}
                    <input type="number" className="form-input" value={item.quantity} min={1} onChange={(e) => updateCart(i, 'quantity', e.target.value)} required />
                  </div>
                  <button type="button" className="btn-icon" onClick={() => removeFromCart(i)} style={{ color: 'var(--accent-danger)', marginBottom: 2 }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={addToCart} style={{ marginBottom: 16 }}>
                <Plus size={14} /> Add Item
              </button>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount Given</label>
                  <input
                    type="number"
                    className="form-input"
                    value={amountGiven}
                    onChange={(e) => setAmountGiven(e.target.value)}
                    placeholder="₹0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Change to Return</label>
                  <div
                    className="form-input"
                    style={{
                      background: 'var(--bg-card)',
                      fontWeight: 700,
                      color: Number(amountGiven) - getCartTotal() >= 0 ? 'var(--accent-success)' : 'var(--text-muted)',
                      borderColor: 'transparent',
                    }}
                  >
                    {Number(amountGiven) && Number(amountGiven) - getCartTotal() >= 0
                      ? formatCurrency(Number(amountGiven) - getCartTotal())
                      : '—'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 700, margin: '12px 0', color: 'var(--accent-success)' }}>
                Total: {formatCurrency(getCartTotal())}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || cart.length === 0}>
                  {saving ? 'Recording…' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
