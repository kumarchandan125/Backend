import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Package, AlertTriangle, IndianRupee, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: any[];
  revenue: { today: number; month: number };
  topSellingProducts: any[];
  recentSales: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><p>Failed to load dashboard</p></div>;

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon purple"><Package size={22} /></div>
          <div className="stat-value">{data.totalProducts}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><AlertTriangle size={22} /></div>
          <div className="stat-value">{data.lowStockCount}</div>
          <div className="stat-label">Low Stock Alerts</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><IndianRupee size={22} /></div>
          <div className="stat-value">{formatCurrency(data.revenue.today)}</div>
          <div className="stat-label">Today's Revenue</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan"><TrendingUp size={22} /></div>
          <div className="stat-value">{formatCurrency(data.revenue.month)}</div>
          <div className="stat-label">Monthly Revenue</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Top Selling Products Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
          </div>
          {data.topSellingProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1a1f35', border: '1px solid #1e293b', borderRadius: 8, color: '#f1f5f9' }}
                />
                <Bar dataKey="totalQuantity" fill="#6366f1" radius={[4, 4, 0, 0]} name="Qty Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No sales data yet</p></div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Sales</h3>
          </div>
          {data.recentSales.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((s: any) => (
                    <tr key={s._id}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{s.invoiceNumber}</td>
                      <td>{formatCurrency(s.totalAmount)}</td>
                      <td><span className="badge badge-info">{s.paymentMethod.toUpperCase()}</span></td>
                      <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state"><p>No sales yet</p></div>
          )}
        </div>
      </div>

      {/* Low Stock Products */}
      {data.lowStockProducts.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h3 className="card-title">⚠️ Low Stock Products</h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Product</th><th>Current Stock</th><th>Minimum</th><th>Unit</th></tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p: any) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                    <td><span className="badge badge-danger">{p.stock.current}</span></td>
                    <td>{p.stock.minimum}</td>
                    <td>{p.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
