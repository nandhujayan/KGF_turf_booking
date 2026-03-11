import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock, CheckCircle2, CreditCard, Info, Lock } from 'lucide-react';
import type { Sport, TimeSlot } from '../types';
import { SLOTS } from '../constants';

interface BookingSystemProps {
  sport: Sport;
  user: any;
  onComplete: (bookingId: string) => void;
  onLoginRequest: () => void;
}

export default function BookingSystem({ sport, user, onComplete, onLoginRequest }: BookingSystemProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);
  const [customSlots, setCustomSlots] = useState<TimeSlot[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [currentLockId, setCurrentLockId] = useState<string | null>(null);
  
  const slotsContainerRef = useRef<HTMLDivElement>(null);

  const dates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));
  }, []);

  useEffect(() => {
    fetchBlockedSlots();
    fetchCustomSlots();
    setSelectedSlots([]);
    setLockError(null);
    setCurrentLockId(null);

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchBlockedSlots();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedDate, sport]); // Removed user from dependency array to persist state on login

  // Scroll to slots on date change (mobile only)
  useEffect(() => {
    if (window.innerWidth < 768 && slotsContainerRef.current) {
      slotsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedDate]);

  // Unlock on unmount if we have a lock
  useEffect(() => {
    return () => {
      if (currentLockId) {
        fetch('/api/bookings/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lockId: currentLockId })
        }).catch(console.error);
      }
    };
  }, [currentLockId]);

  const fetchBlockedSlots = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const url = `/api/blocked-slots?date=${dateStr}${user ? `&userId=${user.id}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setBlockedSlots(data);
    } catch (err) {
      console.error("Failed to fetch blocked slots", err);
    }
  };

  const fetchCustomSlots = async () => {
    try {
      const res = await fetch(`/api/slots?sport=${sport}`);
      const data = await res.json();
      const mapped = data.map((s: any) => ({
        id: `custom-${s.id}`,
        time: s.time,
        isBooked: false,
        price: s.price
      }));
      setCustomSlots(mapped);
    } catch (err) {
      console.error("Failed to fetch custom slots", err);
    }
  };

  const allSlots = [...SLOTS, ...customSlots];

  const toggleSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
    setLockError(null);
  };

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  const applyPromoCode = async () => {
    if (!promoCode) return;
    try {
      const res = await fetch('/api/promo/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      });
      if (res.ok) {
        const data = await res.json();
        setDiscount(data.discountPercent);
        setPromoError(null);
      } else {
        setPromoError("Invalid code");
        setDiscount(0);
      }
    } catch (err) {
      setPromoError("Error applying code");
    }
  };

  const totalPrice = useMemo(() => {
    const base = selectedSlots.reduce((acc, id) => {
      const slot = allSlots.find(s => s.id === id);
      return acc + (slot?.price || 0);
    }, 0);
    return base * (1 - discount / 100);
  }, [selectedSlots, allSlots, discount]);

  const handleBooking = async () => {
    if (selectedSlots.length === 0) return;
    
    if (!user) {
      onLoginRequest();
      return;
    }

    setIsProcessing(true);
    setLockError(null);

    try {
      // 0. Unlock previous lock if exists (to prevent self-blocking on retry)
      if (currentLockId) {
        await fetch('/api/bookings/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lockId: currentLockId })
        });
        setCurrentLockId(null);
      }

      // 1. Lock Slots
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const lockRes = await fetch('/api/bookings/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: selectedSlots, date: dateStr, sport, userId: user.id })
      });

      if (!lockRes.ok) {
        setLockError("Some slots are no longer available. Please re-select.");
        setIsProcessing(false);
        // Refresh slots
        fetchBlockedSlots();
        return;
      }

      const { lockId } = await lockRes.json();
      setCurrentLockId(lockId);

      // 2. Proceed to Booking (Simulated Payment)
      const bookingId = `KGF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const bookingData = {
        id: bookingId,
        userId: user.id,
        userName: user.name,
        sport,
        date: dateStr,
        slots: selectedSlots,
        totalPrice,
        lockId // Pass lockId to server to confirm this lock
      };

      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      if (bookRes.ok) {
        setCurrentLockId(null); // Lock converted to booking
        onComplete(bookingId);
      } else {
        throw new Error("Booking failed");
      }
    } catch (err) {
      console.error("Booking failed", err);
      setLockError("Booking failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Date Selection */}
        <div className="lg:col-span-1 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="text-primary w-5 h-5" />
            <h2 className="text-xl font-display font-bold tracking-tight">SELECT DATE</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {dates.map((date) => (
              <motion.button
                key={date.toISOString()}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDate(date)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isSameDay(selectedDate, date)
                    ? 'bg-primary border-primary text-secondary font-bold shadow-[0_0_20px_rgba(0,255,136,0.2)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`text-[10px] uppercase tracking-tighter mb-1 ${isSameDay(selectedDate, date) ? 'text-secondary/60' : 'text-white/40'}`}>
                  {format(date, 'EEEE')}
                </div>
                <div className="text-lg font-display">
                  {format(date, 'MMM d')}
                </div>
              </motion.button>
            ))}
            
            {/* Calendar Picker Button */}
            <div className="relative col-span-2 mt-2">
              <input 
                type="date" 
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-center gap-3 text-[10px] font-black tracking-widest uppercase text-white/60">
                <Calendar className="w-4 h-4 text-primary" />
                {dates.some(d => isSameDay(d, selectedDate)) ? 'SELECT OTHER DATE' : format(selectedDate, 'MMMM d, yyyy')}
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-primary mb-3">
              <Info className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Booking Info</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Slots are locked for 10 minutes during payment. 
              Please complete your booking to secure your time.
            </p>
          </div>
        </div>

        {/* Slot Selection */}
        <div className="lg:col-span-2 space-y-8" ref={slotsContainerRef}>
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-primary w-5 h-5" />
            <h2 className="text-xl font-display font-bold tracking-tight">AVAILABLE SLOTS</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-48 md:pb-0">
            {allSlots.map((slot) => {
              const isBlocked = blockedSlots.includes(slot.id);
              const isSelected = selectedSlots.includes(slot.id);
              
              return (
                <motion.button
                  key={slot.id}
                  disabled={isBlocked}
                  whileHover={!isBlocked ? { y: -4 } : {}}
                  whileTap={!isBlocked ? { scale: 0.95 } : {}}
                  onClick={() => toggleSlot(slot.id)}
                  className={`relative p-5 rounded-xl border transition-all text-left ${
                    isBlocked
                      ? 'bg-red-500/5 border-red-500/10 opacity-30 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary/10 border-primary shadow-[inset_0_0_15px_rgba(0,255,136,0.1)]'
                      : 'bg-white/5 border-white/10 hover:border-primary/30'
                  }`}
                >
                  <div className="text-base font-display font-bold mb-1">{slot.time}</div>
                  <div className={`text-[10px] font-mono ${isSelected ? 'text-primary' : 'text-white/30'}`}>
                    ₹{slot.price}
                  </div>
                  {isSelected && (
                    <motion.div
                      layoutId="slot-check"
                      className="absolute top-2 right-2 text-primary"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </motion.div>
                  )}
                  {isBlocked && (
                    <div className="absolute top-2 right-2 text-red-500/50">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Checkout Summary */}
          <AnimatePresence>
            {selectedSlots.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-0 left-0 w-full p-4 z-40 md:relative md:p-0 md:mt-12 md:bg-transparent md:border-none"
              >
                <div className="bg-[#0a0f1c]/90 backdrop-blur-xl border border-primary/20 p-6 rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:bg-white/5 md:backdrop-blur-md">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1 w-full md:w-auto">
                      <h3 className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">YOUR SELECTION</h3>
                      <div className="text-xl font-display font-bold text-white">
                        {selectedSlots.length} SLOTS • {sport.toUpperCase()} ARENA
                      </div>
                      <div className="text-xs text-white/40">
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="PROMO CODE" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-bold focus:border-primary/50 outline-none transition-all"
                        />
                        <button 
                          onClick={applyPromoCode}
                          className="bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-black px-3 py-1.5 rounded-lg transition-all uppercase"
                        >
                          APPLY
                        </button>
                      </div>
                      {promoError && <div className="text-red-400 text-[10px] mt-1 font-bold uppercase">{promoError}</div>}
                      {discount > 0 && <div className="text-primary text-[10px] mt-1 font-bold uppercase">{discount}% DISCOUNT APPLIED!</div>}

                      {lockError && (
                        <div className="text-red-400 text-xs font-bold mt-2">{lockError}</div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="text-right flex-1 md:flex-none hidden md:block">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">TOTAL</div>
                        <div className="text-3xl font-display font-bold text-primary">₹{totalPrice}</div>
                      </div>
                      <motion.button
                        onClick={handleBooking}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative overflow-hidden flex-1 md:flex-none px-8 py-4 bg-gradient-to-r from-primary to-emerald-400 text-secondary font-black text-lg rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)] transition-all"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {isProcessing ? (
                            <div className="w-6 h-6 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <span className="md:hidden mr-2">PAY ₹{totalPrice}</span>
                              <span className="hidden md:inline">CONFIRM BOOKING</span>
                              <CreditCard className="w-5 h-5" />
                            </>
                          )}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
