import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Users, Map, CreditCard, CheckCircle } from 'lucide-react';
import api from '../services/api';

const DashboardOverview = () => {
  const [summary, setSummary] = useState({
    totalUsers: 0, totalTrips: 0, activeTrips: 0, totalRevenue: 0, totalBookings: 0, pendingPayments: 0
  });
  const [chartData, setChartData] = useState([]);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/admin/summary');
        if (res.data.success) {
          setSummary(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch summary", err);
      }
    };

    const fetchChartData = async () => {
      try {
        const res = await api.get('/admin/bookings/monthly');
        if (res.data.success && res.data.data.length > 0) {
          const formatted = res.data.data.map(item => ({
            name: MONTHS[item._id - 1],
            revenue: item.totalRevenue,
            bookings: item.totalBookings,
          }));
          setChartData(formatted);
        } else {
          // Fallback placeholder so charts don't look empty on first load
          setChartData(MONTHS.slice(0, 6).map(m => ({ name: m, revenue: 0, bookings: 0 })));
        }
      } catch (err) {
        console.error("Failed to fetch chart data", err);
      }
    };

    fetchSummary();
    fetchChartData();
  }, []);

  const statCards = [
    { title: 'Total Revenue', value: `₹${summary.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Total Bookings', value: summary.totalBookings, icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Active Trips', value: summary.activeTrips, icon: Map, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { title: 'Total Users', value: summary.totalUsers, icon: Users, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
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

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#aa3bff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#aa3bff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#aa3bff" fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6 rounded-2xl h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Bookings Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <Tooltip 
                cursor={{fill: 'var(--border)', opacity: 0.4}}
                contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
              />
              <Bar dataKey="bookings" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
