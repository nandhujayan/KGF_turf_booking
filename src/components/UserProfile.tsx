import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, MapPin, User, Mail, Phone, Edit3, Save, X, Camera, Download, Share2, Lock, Bell, Trash2, CreditCard, Users, Plus, Shield, History } from 'lucide-react';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { SLOTS } from '../constants';
import { Star, Eye, EyeOff } from 'lucide-react';

interface UserProfileProps {
  user: any;
  onUpdateUser?: (user: any) => void;
  onBookNow?: () => void;
}

type ProfileTab = 'matches' | 'settings' | 'history';

export default function UserProfile({ user: initialUser, onUpdateUser, onBookNow }: UserProfileProps) {
  const [user, setUser] = useState(initialUser);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('matches');
  const [editForm, setEditForm] = useState({
    name: initialUser.name,
    email: initialUser.email || '',
    phone: initialUser.phone || '',
    photo: initialUser.photo || ''
  });
  const [saving, setSaving] = useState(false);

  // Settings state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [changingPw, setChangingPw] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ bookingConfirm: true, reminders: true, promos: false });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Team Members state
  const [teamMembers, setTeamMembers] = useState<{ [bookingId: string]: string[] }>({});
  const [newMember, setNewMember] = useState<{ [bookingId: string]: string }>({});

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

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return setPwMsg({ type: 'error', text: 'Fill both fields' });
    if (newPassword.length < 6) return setPwMsg({ type: 'error', text: 'New password must be ≥ 6 chars' });
    setChangingPw(true);
    try {
      const res = await fetch(`/api/user/${user.id}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully!' });
        setOldPassword(''); setNewPassword('');
      } else {
        setPwMsg({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch {
      setPwMsg({ type: 'error', text: 'Network error' });
    } finally {
      setChangingPw(false);
    }
  };

  const getSlotTime = (slotId: string) => {
    const slot = SLOTS.find(s => s.id === slotId);
    return slot ? slot.time : slotId;
  };

  const handleGetDirections = () => {
    window.open('https://www.google.com/maps/search/?api=1&query=KGF+Arena+Turf', '_blank');
  };

  const handleRate = async (bookingId: string, rating: number) => {
    setRatingLoading(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, rating } : b));
      }
    } catch (err) {
      console.error("Rating failed", err);
    } finally {
      setRatingLoading(null);
    }
  };

  const addTeamMember = (bookingId: string) => {
    const name = newMember[bookingId]?.trim();
    if (!name) return;
    setTeamMembers(prev => ({
      ...prev,
      [bookingId]: [...(prev[bookingId] || []), name]
    }));
    setNewMember(prev => ({ ...prev, [bookingId]: '' }));
  };

  const removeTeamMember = (bookingId: string, idx: number) => {
    setTeamMembers(prev => ({
      ...prev,
      [bookingId]: prev[bookingId].filter((_, i) => i !== idx)
    }));
  };

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'matches', label: 'MY MATCHES', icon: Calendar },
    { id: 'history', label: 'PAYMENT HISTORY', icon: History },
    { id: 'settings', label: 'SETTINGS', icon: Shield },
  ];

  return (
    <div className="pt-32 px-4 pb-20 max-w-4xl mx-auto min-h-screen">
      {/* Profile Header */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 mb-8 relative overflow-hidden group">
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

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 bg-white/5 rounded-2xl p-2 border border-white/10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all ${
              activeTab === tab.id ? 'bg-primary text-secondary shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'text-white/40 hover:text-white'
            }`}
          >
            <tab.icon className="w-3 h-3" /> {tab.label}
          </button>
        ))}
      </div>

      {/* MATCHES TAB */}
      {activeTab === 'matches' && (
        <>
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
              <button onClick={onBookNow} className="px-8 py-4 bg-primary text-secondary rounded-2xl font-black tracking-widest text-xs hover:scale-105 transition-all">
                BOOK YOUR FIRST MATCH
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => {
                const bookedSlots = JSON.parse(booking.slots);
                const timeRange = bookedSlots.map((id: string) => getSlotTime(id)).join(', ');
                const members = teamMembers[booking.id] || [];
                
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row gap-8 items-center group hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mb-2">KGF ARENA • {booking.sport.toUpperCase()}</div>
                          <div className="text-3xl font-display font-black tracking-tight mb-2">MATCH PASS</div>
                          <div className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" /> {booking.user_name}
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {booking.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                          <div className="font-mono text-sm text-white/80">{timeRange}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2 font-black">
                            <CreditCard className="w-3 h-3 text-primary" /> PAYMENT
                          </div>
                          <div className="font-display font-bold text-lg text-primary">₹{booking.total_price}</div>
                          <div className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">Online Payment</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2 font-black">
                            <Users className="w-3 h-3 text-primary" /> TEAM ({members.length})
                          </div>
                          <div className="space-y-1">
                            {members.map((m, i) => (
                              <div key={i} className="flex items-center justify-between text-xs text-white/60">
                                <span>• {m}</span>
                                <button onClick={() => removeTeamMember(booking.id, i)} className="text-red-400/50 hover:text-red-400 ml-2">×</button>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Add player name..."
                                value={newMember[booking.id] || ''}
                                onChange={e => setNewMember(p => ({ ...p, [booking.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addTeamMember(booking.id)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white outline-none focus:border-primary"
                              />
                              <button onClick={() => addTeamMember(booking.id)} className="bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-2 py-1">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-6">
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

                    <div className="flex flex-col items-center gap-6 flex-shrink-0">
                      {booking.is_completed ? (
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex flex-col items-center bg-[#0a0f1c]">
                          <div className="text-secondary text-5xl mb-4 text-center">🏆</div>
                          <div className="text-[12px] font-black tracking-[0.3em] uppercase text-primary text-center">MATCH<br/>COMPLETED</div>
                          <div className="mt-6 border-t border-white/10 pt-4 w-full flex flex-col items-center">
                            <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">Rate Your Match</div>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => handleRate(booking.id, star)}
                                  disabled={ratingLoading === booking.id || booking.rating > 0}
                                  className={`p-1 transition-all ${
                                    (booking.rating >= star) ? 'text-yellow-400' : 'text-white/20 hover:text-yellow-400/50'
                                  } ${booking.rating > 0 ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <Star className={`w-6 h-6 ${(booking.rating >= star) ? 'fill-yellow-400' : ''}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-[2rem] flex-shrink-0 shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
                          <QRCodeSVG value={booking.id} size={120} />
                          <div className="text-[8px] font-black text-black/40 text-center mt-4 tracking-[0.3em] uppercase">SCAN AT ENTRY</div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* PAYMENT HISTORY TAB */}
      {activeTab === 'history' && (
        <div>
          <h2 className="text-2xl font-display font-black flex items-center gap-3 tracking-tight mb-8">
            <History className="text-primary w-6 h-6" /> PAYMENT HISTORY
          </h2>
          {loading ? (
            <div className="text-center py-24">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <p className="text-white/30 font-bold tracking-widest uppercase text-sm">No payment history yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5">
                  <div className="text-[10px] text-primary uppercase tracking-widest font-black mb-2">TOTAL SPENT</div>
                  <div className="text-3xl font-display font-black text-white">₹{bookings.reduce((s, b) => s + (b.total_price || 0), 0).toLocaleString()}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">BOOKINGS</div>
                  <div className="text-3xl font-display font-black text-white">{bookings.length}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-2">AVG PER BOOKING</div>
                  <div className="text-3xl font-display font-black text-white">₹{bookings.length ? Math.round(bookings.reduce((s, b) => s + (b.total_price || 0), 0) / bookings.length) : 0}</div>
                </div>
              </div>
              {/* Transactions */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 text-[10px] font-black tracking-[0.2em] text-white/40 uppercase grid grid-cols-4 gap-4">
                  <span>BOOKING ID</span>
                  <span>DATE</span>
                  <span>SPORT</span>
                  <span className="text-right">AMOUNT</span>
                </div>
                {bookings.map((b) => (
                  <div key={b.id} className="px-6 py-4 border-b border-white/5 grid grid-cols-4 gap-4 hover:bg-white/5 transition-colors">
                    <span className="font-mono text-xs text-white/60 truncate">{b.id}</span>
                    <span className="text-xs text-white/60">{format(new Date(b.date), 'MMM d, yyyy')}</span>
                    <span className="text-xs text-white/60 uppercase">{b.sport}</span>
                    <span className="text-right font-display font-bold text-primary">₹{b.total_price?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h3 className="text-lg font-display font-black tracking-tight flex items-center gap-3 mb-6">
              <Lock className="text-primary w-5 h-5" /> CHANGE PASSWORD
            </h3>
            {pwMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-bold uppercase tracking-widest ${pwMsg.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {pwMsg.text}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Current Password</label>
                <div className="relative">
                  <input type={showOldPw ? 'text' : 'password'} value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowOldPw(!showOldPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary">
                    {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                  <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button onClick={handleChangePassword} disabled={changingPw} className="px-6 py-3 bg-primary text-secondary rounded-xl font-black text-xs tracking-widest hover:scale-105 transition-all disabled:opacity-50">
                {changingPw ? 'UPDATING...' : 'UPDATE PASSWORD'}
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
            <h3 className="text-lg font-display font-black tracking-tight flex items-center gap-3 mb-6">
              <Bell className="text-primary w-5 h-5" /> NOTIFICATION SETTINGS
            </h3>
            <div className="space-y-4">
              {[
                { key: 'bookingConfirm', label: 'Booking Confirmations', desc: 'Get notified when a booking is confirmed' },
                { key: 'reminders', label: 'Match Reminders', desc: 'Reminders 1 hour before your match' },
                { key: 'promos', label: 'Promotions & Offers', desc: 'Exclusive discounts and promo codes' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <div className="text-sm font-bold text-white">{label}</div>
                    <div className="text-[10px] text-white/40 mt-1">{desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifSettings(p => ({ ...p, [key]: !p[key as keyof typeof notifSettings] }))}
                    className={`w-12 h-6 rounded-full relative transition-all ${notifSettings[key as keyof typeof notifSettings] ? 'bg-primary' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifSettings[key as keyof typeof notifSettings] ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-8">
            <h3 className="text-lg font-display font-black tracking-tight flex items-center gap-3 mb-2 text-red-400">
              <Trash2 className="w-5 h-5" /> DELETE ACCOUNT
            </h3>
            <p className="text-white/40 text-sm mb-6">This action is irreversible. All your bookings and data will be permanently deleted.</p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                className="w-full bg-white/5 border border-red-500/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                disabled={deleteConfirm !== 'DELETE'}
                className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black text-xs tracking-widest hover:bg-red-500/30 transition-all disabled:opacity-30"
              >
                PERMANENTLY DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
