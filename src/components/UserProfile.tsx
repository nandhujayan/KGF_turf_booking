import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, User, Mail, Phone, Edit3, Save, X, Camera, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { SLOTS } from '../constants';

interface UserProfileProps {
  user: any;
  onUpdateUser?: (user: any) => void;
}

export default function UserProfile({ user: initialUser, onUpdateUser }: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: initialUser.name,
    email: initialUser.email || '',
    phone: initialUser.phone || '',
    photo: initialUser.photo || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/${user.id}/bookings`)
        .then(res => res.json())
        .then(data => {
          setBookings(data);
          setLoading(false);
        });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
        if (onUpdateUser) onUpdateUser(updatedUser);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setSaving(false);
    }
  };

  const getSlotTime = (slotId: string) => {
    const slot = SLOTS.find(s => s.id === slotId);
    return slot ? slot.time : slotId;
  };

  const handleGetDirections = () => {
    window.open('https://www.google.com/maps/search/?api=1&query=KGF+Arena+Turf', '_blank');
  };

  return (
    <div className="pt-32 px-4 pb-20 max-w-4xl mx-auto min-h-screen">
      {/* Profile Header */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group/avatar">
            <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-primary to-emerald-400 p-1">
              <div className="w-full h-full rounded-[2.3rem] bg-[#0a0f1c] flex items-center justify-center overflow-hidden">
                {editForm.photo ? (
                  <img src={editForm.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl font-black text-primary">{user.name[0]}</span>
                )}
              </div>
            </div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-white text-secondary rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <input 
                    type="text" 
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-2xl font-display font-black text-white w-full outline-none focus:border-primary"
                    placeholder="NAME"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white w-full outline-none focus:border-primary"
                        placeholder="EMAIL"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input 
                        type="text" 
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-white w-full outline-none focus:border-primary"
                        placeholder="PHONE"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center md:justify-start pt-2">
                    <button 
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      className="px-6 py-3 bg-primary text-secondary rounded-xl font-black text-xs tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
                    >
                      {saving ? 'SAVING...' : <><Save className="w-4 h-4" /> SAVE CHANGES</>}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 bg-white/5 text-white/60 rounded-xl font-black text-xs tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <X className="w-4 h-4" /> CANCEL
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <h1 className="text-4xl font-display font-black tracking-tight">{user.name}</h1>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="p-2 bg-white/5 text-white/20 rounded-xl hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-6">
                    <div className="flex items-center gap-2 text-white/40 text-sm font-bold tracking-widest">
                      <Mail className="w-4 h-4 text-primary" /> {user.email || 'NO EMAIL'}
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-sm font-bold tracking-widest">
                      <Phone className="w-4 h-4 text-primary" /> {user.phone}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-display font-black flex items-center gap-3 tracking-tight">
          <Calendar className="text-primary w-6 h-6" /> YOUR MATCHES
        </h2>
        <div className="text-[10px] font-black tracking-[0.3em] text-white/20 uppercase">
          {bookings.length} TOTAL BOOKINGS
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[10px] font-black tracking-widest text-white/20 uppercase">Syncing your matches...</div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
          <p className="text-white/30 font-bold tracking-widest uppercase text-sm mb-6">No matches found yet.</p>
          <button className="px-8 py-4 bg-primary text-secondary rounded-2xl font-black tracking-widest text-xs hover:scale-105 transition-all">
            BOOK YOUR FIRST MATCH
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const bookedSlots = JSON.parse(booking.slots);
            const timeRange = bookedSlots.map((id: string) => getSlotTime(id)).join(', ');
            
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center group hover:border-primary/30 transition-all"
              >
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2">KGF ARENA • {booking.sport.toUpperCase()}</div>
                      <div className="text-3xl font-display font-black tracking-tight">MATCH PASS</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      booking.status === 'confirmed' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {booking.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2 font-black">
                        <Calendar className="w-3 h-3 text-primary" /> DATE
                      </div>
                      <div className="text-lg font-display font-bold">{format(new Date(booking.date), 'EEEE, MMM d')}</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2 font-black">
                        <Clock className="w-3 h-3 text-primary" /> TIME SLOTS
                      </div>
                      <div className="font-mono text-sm text-white/80">
                        {timeRange}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-6">
                    <button 
                      onClick={handleGetDirections}
                      className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-primary transition-colors tracking-widest uppercase"
                    >
                      <MapPin className="w-4 h-4" /> GET DIRECTIONS
                    </button>
                    <button 
                      className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-primary transition-colors tracking-widest uppercase"
                    >
                      <Download className="w-4 h-4" /> DOWNLOAD PASS
                    </button>
                    <button 
                      className="flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-primary transition-colors tracking-widest uppercase"
                    >
                      <Share2 className="w-4 h-4" /> SHARE
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] flex-shrink-0 shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                  <QRCodeSVG value={booking.id} size={120} />
                  <div className="text-[8px] font-black text-black/40 text-center mt-4 tracking-[0.3em] uppercase">SCAN AT ENTRY</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
