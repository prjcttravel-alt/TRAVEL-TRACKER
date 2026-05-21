import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  CreditCard, 
  BarChart3, 
  Users, 
  Settings, 
  Bell, 
  Sun, 
  Moon,
  Menu,
  X,
  Search,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { io } from 'socket.io-client';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

const AdminLayout = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = (() => {
      try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
    })();

    if (!token) {
      navigate('/login');
    } else if (storedUser && storedUser.role !== 'admin') {
      navigate('/login');
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // In dev the admin runs on :5174 but the socket server is on :5001
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    const socket = io(SOCKET_URL);
    socket.on('new-booking', (data) => {
      setNotifications(prev => [{ id: Date.now(), text: `New booking for ${data.tripName}` }, ...prev]);
    });
    return () => socket.disconnect();
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/' },
    { icon: Map, label: 'Active Trips', path: '/trips/active' },
    { icon: CreditCard, label: 'Payments', path: '/payments' },
    { icon: BarChart3, label: 'Booking Analytics', path: '/analytics/bookings' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Search, label: 'Search Trends', path: '/searches' },
    { icon: AlertTriangle, label: 'Cancellations', path: '/cancellations' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 glass-panel border-r`}>
        <div className="h-full px-3 py-4 overflow-y-auto bg-transparent">
          <div className="flex items-center justify-between mb-6 px-2">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-sky-500">
              TRAVEL TRACKER
            </h1>
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          <ul className="space-y-2 font-medium mt-8">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path}
                  className={({isActive}) => `flex items-center p-3 rounded-lg group transition-all ${isActive ? 'bg-[var(--color-primary-light)] bg-opacity-20 text-[var(--color-primary)]' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                >
                  <item.icon className="w-5 h-5 transition duration-75" />
                  <span className="ml-3">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-4 left-0 w-full px-3">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3">Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`p-4 sm:ml-64 w-full min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="glass-panel rounded-xl mb-6 p-4 flex justify-between items-center z-10 sticky top-4">
          <div className="flex items-center">
            <button className="mr-4 md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold">Admin Portal</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="cursor-pointer hover:text-[var(--color-primary)] transition-colors" size={24} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-sky-500 border-2 border-white shadow-md cursor-pointer"></div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
