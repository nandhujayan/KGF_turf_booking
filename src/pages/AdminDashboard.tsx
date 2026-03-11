import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Calendar, Users, DollarSign, Activity, Lock, Settings, 
  ShieldAlert, Trash2, CheckCircle, XCircle, Search, 
  Filter, Tag, Clock, MapPin, Phone, Info, AlertTriangle,
  QrCode, RefreshCw, ChevronRight, LayoutDashboard, Download,
  FileText, TrendingUp, Check
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { SLOTS } from '../constants';

const COLORS = ['#00ff88', '#0088FE', '#FFBB28', '#FF8042', '#8884d8'];

type Tab = 'overview' | 'bookings' | 'slots' | 'users' | 'settings' | 'verify';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Data states
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('all');

  useEffect(() => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchBookings(),
        fetchUsers(),
        fetchSettings(),
        fetchPromos()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data);
  };

  const exportToCSV = () => {
    const headers = ['Booking ID', 'User', 'Sport', 'Date', 'Slots', 'Amount', 'Status'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.user_name,
      b.sport,
      b.date,
      JSON.parse(b.slots).join('; '),
      b.total_price,
      b.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kgf_arena_bookings_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchBookings = async () => {
    const res = await fetch('/api/admin/bookings');
    const data = await res.json();
    setBookings(data);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    setSettings(data);
  };

  const fetchPromos = async () => {
    const res = await fetch('/api/admin/promo-codes');
    const data = await res.json();
    setPromos(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        fetchAllData();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    const res = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: id })
    });
    if (res.ok) fetchBookings();
  };

  const handleBlockUser = async (userId: number, currentStatus: number) => {
    const res = await fetch('/api/admin/users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, blocked: !currentStatus })
    });
    if (res.ok) fetchUsers();
  };

  const handleUpdateSettings = async (newSettings: any) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: newSettings })
    });
    if (res.ok) fetchSettings();
  };

  const QRScannerView = () => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [scanResult, setScanResult] = useState<any>(null);

    useEffect(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scannerRef.current.render(onScanSuccess, onScanError);

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }
      };
    }, []);

    async function onScanSuccess(decodedText: string) {
      try {
        const res = await fetch('/api/admin/bookings/verify', { 
          method: 'POST', 
          headers: {'Content-Type':'application/json'}, 
          body: JSON.stringify({ bookingId: decodedText }) 
        });
        const data = await res.json();
        if (data.success) {
          setScanResult(data.booking);
        } else {
          alert('INVALID BOOKING ID');
        }
      } catch (err) {
        console.error("Scan error", err);
      }
    }

    function onScanError(err: any) {
      // console.warn(err);
    }

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto space-y-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">QR VERIFICATION</h1>
          <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Scan user pass to verify entry</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] space-y-8">
          <div id="reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/20" />
          
          <div className="relative">
            <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
            <input 
              type="text" 
              placeholder="OR ENTER BOOKING ID..."
              className="w-full bg-black/40 border border-white/10 rounded-[2rem] py-8 pl-16 pr-8 text-xl font-display font-black tracking-widest text-white outline-none focus:border-primary transition-all"
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  onScanSuccess((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>

          <AnimatePresence>
            {scanResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 bg-primary/10 rounded-[2rem] border border-primary/20 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-display font-black text-primary uppercase">VERIFIED ✅</h4>
                  <button onClick={() => setScanResult(null)} className="text-white/20 hover:text-white"><XCircle className="w-6 h-6" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">USER</div>
                    <div className="font-bold text-white">{scanResult.user_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">SPORT</div>
                    <div className="font-bold text-white uppercase">{scanResult.sport}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-white/40 font-black uppercase tracking-widest">SLOTS</div>
                    <div className="font-mono text-primary">{JSON.parse(scanResult.slots).join(', ')}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const handleAddPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const code = (form.elements.namedItem('code') as HTMLInputElement).value;
    const discountPercent = (form.elements.namedItem('discount') as HTMLInputElement).value;
    
    const res = await fetch('/api/admin/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, discountPercent })
    });
    if (res.ok) {
      fetchPromos();
      form.reset();
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.user_name.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !dateFilter || b.date === dateFilter;
    const matchesSport = sportFilter === 'all' || b.sport === sportFilter;
    return matchesSearch && matchesDate && matchesSport;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-center mb-6 text-white">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                placeholder="Enter password"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-secondary font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-black/40 border-r border-white/5 p-6 flex flex-col gap-8 pt-24">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Settings className="text-secondary w-6 h-6" />
          </div>
          <span className="text-xl font-display font-black tracking-tighter text-white">ADMIN<span className="text-primary italic">HUB</span></span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
            { id: 'bookings', icon: Calendar, label: 'Bookings' },
            { id: 'slots', icon: Clock, label: 'Slots' },
            { id: 'users', icon: Users, label: 'Users' },
            { id: 'verify', icon: QrCode, label: 'Verify QR' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-secondary' 
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <XCircle className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 pt-24 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">DASHBOARD OVERVIEW</h1>
                    <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Real-time performance analytics</p>
                  </div>
                  <button onClick={fetchAllData} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                    <RefreshCw className={`w-5 h-5 text-primary ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Today Revenue', value: `₹${stats?.todayRevenue || 0}`, sub: `Month: ₹${stats?.monthRevenue || 0}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Today Bookings', value: stats?.todayBookingsCount || 0, sub: `Month: ${stats?.monthBookingsCount || 0}`, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Total Users', value: stats?.totalUsers || 0, sub: 'Active Athletes', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { label: 'Avg. Ticket', value: `₹${Math.round((stats?.revenueData?.reduce((a:any,c:any)=>a+c.amount,0)||0) / (stats?.totalBookings || 1))}`, sub: 'Per Booking', icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-all" />
                      <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 relative z-10`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1 relative z-10">{stat.label}</div>
                      <div className="text-3xl font-display font-black text-white relative z-10">{stat.value}</div>
                      <div className="text-[10px] text-white/20 font-bold mt-2 relative z-10">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
                    <h3 className="text-xl font-display font-black text-white mb-8 uppercase tracking-tight">REVENUE TREND</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.revenueData || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                          <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a1f2e', border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#00ff88', fontWeight: 'bold' }}
                          />
                          <Bar dataKey="amount" fill="#00ff88" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
                    <h3 className="text-xl font-display font-black text-white mb-8 uppercase tracking-tight">SPORT POPULARITY</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats?.sportData || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                          >
                            {(stats?.sportData || []).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">POPULAR TIME SLOTS</h3>
                    <div className="space-y-4">
                      {stats?.popularSlots?.map((slot: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-bold text-white">{slot.slot}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest">{slot.count} BOOKINGS</div>
                            </div>
                          </div>
                          <div className="text-primary font-black text-xs">
                            {Math.round((slot.count / (stats?.totalBookings || 1)) * 100)}%
                          </div>
                        </div>
                      )) || <div className="text-white/20 text-center py-8 text-xs font-bold uppercase tracking-widest">NO DATA AVAILABLE</div>}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">RECENT ACTIVITY</h3>
                    <div className="space-y-4">
                      {stats?.recentBookings?.map((booking: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div>
                            <div className="font-bold text-white uppercase text-[10px] tracking-widest">{booking.user_name}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">{booking.sport} • {new Date(booking.date).toLocaleDateString()}</div>
                          </div>
                          <div className="text-primary font-black text-xs">
                            ₹{booking.total_price}
                          </div>
                        </div>
                      )) || <div className="text-white/20 text-center py-8 text-xs font-bold uppercase tracking-widest">NO RECENT ACTIVITY</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'bookings' && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">BOOKING MANAGEMENT</h1>
                    <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Monitor and control all arena reservations</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        placeholder="SEARCH BY NAME OR ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <input 
                      type="date" 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all text-white"
                    />
                    <select 
                      value={sportFilter}
                      onChange={(e) => setSportFilter(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all text-white"
                    >
                      <option value="all">ALL SPORTS</option>
                      <option value="football">FOOTBALL</option>
                      <option value="cricket">CRICKET</option>
                    </select>
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto">
                    <button 
                      onClick={exportToCSV}
                      className="flex-1 lg:flex-none px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> EXPORT CSV
                    </button>
                    <button 
                      onClick={() => setActiveTab('slots')}
                      className="flex-1 lg:flex-none px-8 py-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-orange-500 hover:text-white transition-all"
                    >
                      CANCEL BY SLOT
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">
                        <tr>
                          <th className="px-8 py-6">BOOKING ID</th>
                          <th className="px-8 py-6">USER</th>
                          <th className="px-8 py-6">SPORT</th>
                          <th className="px-8 py-6">DATE & TIME</th>
                          <th className="px-8 py-6">AMOUNT</th>
                          <th className="px-8 py-6">STATUS</th>
                          <th className="px-8 py-6 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6 font-mono text-white/80">{booking.id}</td>
                            <td className="px-8 py-6">
                              <div className="font-bold text-white">{booking.user_name}</div>
                              <div className="text-[10px] text-white/30 uppercase tracking-widest">ID: {booking.user_id}</div>
                            </td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/60">
                                {booking.sport}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="font-bold text-white">{new Date(booking.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</div>
                              <div className="text-[10px] text-primary font-black uppercase tracking-widest">
                                {JSON.parse(booking.slots).map((id: string) => {
                                  const slot = SLOTS.find(s => s.id === id);
                                  return slot ? slot.time : id;
                                }).join(', ')}
                              </div>
                            </td>
                            <td className="px-8 py-6 font-display font-black text-white">₹{booking.total_price}</td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                booking.status === 'confirmed' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-500'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              {booking.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 transition-all hover:text-white"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">USER DIRECTORY</h1>
                  <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Manage registered athletes and access</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <div key={user.id} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] relative overflow-hidden group">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-primary group-hover:text-secondary transition-all">
                          <Users className="w-8 h-8" />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleBlockUser(user.id, user.is_blocked)}
                            className={`p-3 rounded-xl transition-all ${user.is_blocked ? 'bg-red-500 text-white' : 'bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500'}`}
                            title={user.is_blocked ? "Unblock User" : "Block User"}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm('Delete user?')) {
                                await fetch('/api/admin/users/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userId: user.id}) });
                                fetchUsers();
                              }
                            }}
                            className="p-3 bg-white/5 text-white/40 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-display font-black text-white mb-1 uppercase">{user.name}</h3>
                      <p className="text-white/40 text-xs font-bold tracking-widest mb-6 uppercase">{user.email}</p>
                      
                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                          <span className="text-white/20">PHONE</span>
                          <span className="text-white/60">{user.phone}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                          <span className="text-white/20">JOINED</span>
                          <span className="text-white/60">{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black tracking-widest uppercase">
                          <span className="text-white/20">STATUS</span>
                          <span className={user.is_blocked ? 'text-red-500' : 'text-primary'}>{user.is_blocked ? 'BLOCKED' : 'ACTIVE'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">ARENA SETTINGS</h1>
                  <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Configure turf rules and global parameters</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* General Settings */}
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <Settings className="text-primary w-6 h-6" /> GENERAL CONFIG
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div>
                          <h4 className="font-bold text-white mb-1">MAINTENANCE MODE</h4>
                          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Disable all new bookings temporarily</p>
                        </div>
                        <button 
                          onClick={() => handleUpdateSettings({ maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true' })}
                          className={`w-16 h-8 rounded-full relative transition-all ${settings.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.maintenance_mode === 'true' ? 'left-9' : 'left-1'}`} />
                        </button>
                      </div>

                      {settings.maintenance_mode === 'true' && (
                        <div className="space-y-4">
                          <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">MAINTENANCE REASON</label>
                          <input 
                            type="text" 
                            value={settings.maintenance_reason || ''}
                            onChange={(e) => setSettings({...settings, maintenance_reason: e.target.value})}
                            onBlur={() => handleUpdateSettings({ maintenance_reason: settings.maintenance_reason })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                            placeholder="E.G. TURF RENOVATION"
                          />
                        </div>
                      )}

                      <div className="space-y-4">
                        <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">ARENA NAME</label>
                        <input 
                          type="text" 
                          value={settings.turf_name || ''}
                          onChange={(e) => setSettings({...settings, turf_name: e.target.value})}
                          onBlur={() => handleUpdateSettings({ turf_name: settings.turf_name })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">ARENA DESCRIPTION</label>
                        <textarea 
                          value={settings.description || ''}
                          onChange={(e) => setSettings({...settings, description: e.target.value})}
                          onBlur={() => handleUpdateSettings({ description: settings.description })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all h-32"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">PRICE PER HOUR (₹)</label>
                          <input 
                            type="number" 
                            value={settings.price_per_hour || ''}
                            onChange={(e) => setSettings({...settings, price_per_hour: e.target.value})}
                            onBlur={() => handleUpdateSettings({ price_per_hour: settings.price_per_hour })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">ADMIN PHONE</label>
                          <input 
                            type="text" 
                            value={settings.admin_phone || ''}
                            onChange={(e) => setSettings({...settings, admin_phone: e.target.value})}
                            onBlur={() => handleUpdateSettings({ admin_phone: settings.admin_phone })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">LATITUDE</label>
                          <input 
                            type="text" 
                            value={settings.lat || ''}
                            onChange={(e) => setSettings({...settings, lat: e.target.value})}
                            onBlur={() => handleUpdateSettings({ lat: settings.lat })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black tracking-widest text-white/40 uppercase">LONGITUDE</label>
                          <input 
                            type="text" 
                            value={settings.lng || ''}
                            onChange={(e) => setSettings({...settings, lng: e.target.value})}
                            onBlur={() => handleUpdateSettings({ lng: settings.lng })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promo Codes */}
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <Tag className="text-primary w-6 h-6" /> PROMO CODES
                    </h3>

                    <form onSubmit={handleAddPromo} className="flex gap-4">
                      <input 
                        name="code"
                        placeholder="CODE (E.G. KGF50)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all text-xs"
                        required
                      />
                      <input 
                        name="discount"
                        type="number"
                        placeholder="DISC %"
                        className="w-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-primary transition-all text-xs"
                        required
                      />
                      <button className="bg-primary text-secondary px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                        ADD
                      </button>
                    </form>

                    <div className="space-y-3">
                      {promos.map((promo) => (
                        <div key={promo.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div>
                            <span className="font-mono font-bold text-primary mr-4">{promo.code}</span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{promo.discount_percent}% OFF</span>
                          </div>
                          <button 
                            onClick={async () => {
                              await fetch('/api/admin/promo-codes/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: promo.id}) });
                              fetchPromos();
                            }}
                            className="text-white/20 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'verify' && (
              <QRScannerView />
            )}

            {activeTab === 'slots' && (
              <motion.div
                key="slots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-display font-black text-white mb-2 uppercase">SLOT MANAGEMENT</h1>
                  <p className="text-white/40 text-sm font-bold tracking-widest uppercase">Block or manage specific arena times</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">BLOCK A SLOT</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                      const slotId = (form.elements.namedItem('slot') as HTMLInputElement).value;
                      const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
                      
                      await fetch('/api/admin/block-slot', {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ sport: 'all', date, slotId, reason })
                      });
                      alert('Slot Blocked');
                      form.reset();
                    }} className="space-y-4">
                      <input type="date" name="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" required />
                      <input type="text" name="slot" placeholder="SLOT TIME (E.G. 06:00 - 07:00)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" required />
                      <input type="text" name="reason" placeholder="REASON (E.G. MAINTENANCE)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" />
                      <button className="w-full bg-red-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-600 transition-all">BLOCK SLOT</button>
                    </form>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">CANCEL ALL FOR SLOT</h3>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const date = (form.elements.namedItem('date') as HTMLInputElement).value;
                      const slotId = (form.elements.namedItem('slot') as HTMLInputElement).value;
                      
                      if (!confirm(`Cancel all bookings for ${slotId} on ${date}?`)) return;

                      await fetch('/api/admin/bookings/cancel-slot', {
                        method: 'POST',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({ date, slotId })
                      });
                      alert('All bookings for this slot have been cancelled.');
                      form.reset();
                      fetchBookings();
                    }} className="space-y-4">
                      <input type="date" name="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" required />
                      <input type="text" name="slot" placeholder="SLOT TIME (E.G. 06:00 - 07:00)" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-bold" required />
                      <button className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all">CANCEL ALL BOOKINGS</button>
                    </form>
                  </div>
                </div>

                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-6">SLOT RULES</h3>
                  <ul className="space-y-4">
                    {[
                      "Blocked slots apply to both Football and Cricket.",
                      "Users cannot see or book blocked slots.",
                      "Maintenance mode blocks ALL slots globally.",
                      "Auto-release timer is set to 3 minutes."
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/40">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
