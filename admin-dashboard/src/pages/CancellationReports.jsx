import { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AlertTriangle, RotateCcw, TrendingDown } from 'lucide-react';

const COLORS = ['#aa3bff', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981', '#f97316'];

const CancellationReports = () => {
  const [cancellations, setCancellations] = useState([]);
  const [stats, setStats] = useState({
    totalCancellations: 0,
    cancellationRate: '0%',
    pendingRefunds: 0,
    reasonBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [listRes, statsRes] = await Promise.all([
          api.get('/admin/cancellations'),
          api.get('/admin/cancellations/stats'),
        ]);
        if (listRes.data.success) setCancellations(listRes.data.data);
        if (statsRes.data.success) setStats(statsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch cancellation data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const pieData = stats.reasonBreakdown.length > 0
    ? stats.reasonBreakdown.map(r => ({ name: r._id || 'Unknown', value: r.count }))
    : [{ name: 'No Data', value: 1 }];

  const statCards = [
    { title: 'Total Cancellations', value: stats.totalCancellations, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Cancellation Rate', value: stats.cancellationRate, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Pending Refunds', value: stats.pendingRefunds, icon: RotateCcw, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  ];

  if (loading) return <div className="p-8 text-center">Loading cancellation data...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Cancellation Analytics</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-[var(--text-primary)]">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="glass-panel p-8 rounded-2xl h-[450px]">
          <h3 className="text-lg font-semibold mb-6">Reasons for Cancellation</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="45%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Cancellations Log */}
        <div className="glass-panel p-8 rounded-2xl overflow-hidden">
          <h3 className="text-lg font-semibold mb-6">Recent Cancellation Logs</h3>
          {cancellations.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">No cancellations recorded yet.</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
              {cancellations.slice(0, 10).map((item) => (
                <div key={item._id} className="flex justify-between items-center p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                  <div>
                    <p className="font-semibold text-sm">{item.user?.name || 'Unknown User'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{item.trip?.eventTitle || 'Unknown Trip'}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 italic">{item.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${item.refundStatus === 'Processed' ? 'text-emerald-500' : item.refundStatus === 'Pending' ? 'text-amber-500' : 'text-slate-400'}`}>
                      {item.refundStatus}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      {new Date(item.cancelledAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancellationReports;
