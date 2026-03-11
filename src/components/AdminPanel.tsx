import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Users, 
  Lock, 
  Unlock, 
  Trophy,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

const SLOTS = [
  { id: '06-07', time: '06:00 AM' },
  { id: '07-08', time: '07:00 AM' },
  { id: '08-09', time: '08:00 AM' },
  { id: '09-10', time: '09:00 AM' },
  { id: '10-11', time: '10:00 AM' },
  { id: '16-17', time: '04:00 PM' },
  { id: '17-18', time: '05:00 PM' },
  { id: '18-19', time: '06:00 PM' },
  { id: '19-20', time: '07:00 PM' },
  { id: '20-21', time: '08:00 PM' },
  { id: '21-22', time: '09:00 PM' },
  { id: '22-23', time: '10:00 PM' },
];

export default function AdminPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [customSlots, setCustomSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSport, setSelectedSport] = useState<'football' | 'cricket'>('football');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedDate, selectedSport]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [bookingsRes, blockedRes, slotsRes] = await Promise.all([
        fetch('/api/bookings'),
        fetch(`/api/blocked-slots?sport=${selectedSport}&date=${dateStr}`),
        fetch(`/api/slots?sport=${selectedSport}`)
      ]);
      
      const bookingsData = await bookingsRes.json();
      const blockedData = await blockedRes.json();
      const slotsData = await slotsRes.json();
      
      setBookings(bookingsData);
      setBlockedSlots(blockedData);
      setCustomSlots(slotsData.map((s: any) => ({ id: `custom-${s.id}`, time: s.time })));
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (slotId: string, isBlocked: boolean) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const endpoint = isBlocked ? '/api/admin/unblock-slot' : '/api/admin/block-slot';
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          date: dateStr,
          slotId,
          reason: "Tournament/Maintenance"
        })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to toggle block", err);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to cancel booking", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight mb-2">ADMIN DASHBOARD</h1>
            <p className="text-white/40 text-sm uppercase tracking-widest">Manage your arena operations</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            <button 
              onClick={() => setSelectedSport('football')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedSport === 'football' ? 'bg-primary text-secondary' : 'hover:bg-white/5'}`}
            >
              FOOTBALL
            </button>
            <button 
              onClick={() => setSelectedSport('cricket')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${selectedSport === 'cricket' ? 'bg-primary text-secondary' : 'hover:bg-white/5'}`}
            >
              CRICKET
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "TOTAL BOOKINGS", value: bookings.length, icon: Trophy, color: "text-primary" },
            { label: "REVENUE", value: `₹${bookings.reduce((acc, b) => acc + b.total_price, 0)}`, icon: CheckCircle2, color: "text-accent" },
            { label: "ACTIVE USERS", value: "124", icon: Users, color: "text-white" },
            { label: "BLOCKED SLOTS", value: blockedSlots.length, icon: Lock, color: "text-red-400" },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <button className="text-white/20 hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Slot Management */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-display font-bold">SLOT CONTROL</h2>
                <input 
                  type="date" 
                  value={format(selectedDate, 'yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              
              <div className="space-y-3">
                {/* Add Slot Form */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                  <h3 className="text-xs font-bold mb-3 uppercase tracking-widest text-primary">Add Custom Slot</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const time = (form.elements.namedItem('time') as HTMLInputElement).value;
                    const price = (form.elements.namedItem('price') as HTMLInputElement).value;
                    
                    fetch('/api/admin/add-slot', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sport: selectedSport, time, price: parseInt(price) })
                    }).then(() => {
                      form.reset();
                      fetchData();
                    });
                  }} className="space-y-2">
                    <input name="time" placeholder="Time (e.g. 11:00 AM)" required className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs" />
                    <input name="price" type="number" placeholder="Price (e.g. 1500)" required className="w-full bg-black/20 border border-white/10 rounded px-3 py-2 text-xs" />
                    <button type="submit" className="w-full bg-primary text-secondary text-xs font-bold py-2 rounded">ADD SLOT</button>
                  </form>
                </div>

                {[...SLOTS, ...customSlots].map((slot) => {
                  const isBlocked = blockedSlots.includes(slot.id);
                  return (
                    <div key={slot.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-sm font-bold">{slot.time}</span>
                      </div>
                      <button 
                        onClick={() => toggleBlock(slot.id, isBlocked)}
                        className={`p-2 rounded-lg transition-all ${isBlocked ? 'bg-red-500/20 text-red-500' : 'bg-white/5 text-white/40 hover:bg-primary/20 hover:text-primary'}`}
                      >
                        {isBlocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h2 className="text-lg font-display font-bold">RECENT BOOKINGS</h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Search bookings..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-white/40 uppercase tracking-widest border-b border-white/5">
                      <th className="pb-4 font-bold">BOOKING ID</th>
                      <th className="pb-4 font-bold">USER</th>
                      <th className="pb-4 font-bold">SPORT</th>
                      <th className="pb-4 font-bold">DATE</th>
                      <th className="pb-4 font-bold">PRICE</th>
                      <th className="pb-4 font-bold">STATUS</th>
                      <th className="pb-4 font-bold">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-white/5 group hover:bg-white/5 transition-all">
                        <td className="py-4 font-mono text-xs text-primary">{booking.id}</td>
                        <td className="py-4 font-bold">{booking.user_name}</td>
                        <td className="py-4 uppercase text-xs tracking-widest">{booking.sport}</td>
                        <td className="py-4 text-white/60">{booking.date}</td>
                        <td className="py-4 font-bold">₹{booking.total_price}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            booking.status === 'confirmed' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4">
                          {booking.status === 'confirmed' && (
                            <button 
                              onClick={() => cancelBooking(booking.id)}
                              className="text-xs text-red-400 hover:text-red-300 underline"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
