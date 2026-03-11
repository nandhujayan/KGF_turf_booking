import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Share2, Download, Calendar, MapPin, Trophy, ArrowRight, Navigation, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import { SLOTS } from '../constants';

interface ConfirmationProps {
  bookingId: string;
  onBack: () => void;
}

export default function Confirmation({ bookingId, onBack }: ConfirmationProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    // Fetch booking details
    fetch(`/api/booking/${bookingId}`)
      .then(res => res.json())
      .then(data => setBooking(data))
      .catch(err => console.error("Failed to fetch booking", err));

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [bookingId]);

  const handleDownload = async () => {
    if (ticketRef.current) {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#0a0f1c',
        scale: 2
      } as any);
      const link = document.createElement('a');
      link.download = `KGF-Arena-Pass-${bookingId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KGF Arena Booking Pass',
          text: `My booking confirmed at KGF Arena! ID: ${bookingId}`,
          url: window.location.href
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    }
  };

  const handleMap = () => {
    window.open('https://maps.google.com/?q=KGF+Arena+Turf', '_blank');
  };

  const formatSlots = (slotsJson: string) => {
    try {
      const slotIds = JSON.parse(slotsJson);
      if (!slotIds || slotIds.length === 0) return 'N/A';
      
      const times = slotIds.map((id: string) => {
        const slot = SLOTS.find(s => s.id === id);
        return slot ? slot.time : id;
      });
      
      return times.join(', ');
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20 relative overflow-y-auto">
      {/* Background Stadium Flash Effect */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{ duration: 0.5, times: [0, 0.5, 1], repeat: 2 }}
        className="fixed inset-0 bg-white pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="max-w-xl w-full z-10 my-auto"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,255,136,0.4)]"
          >
            <CheckCircle2 className="w-10 h-10 text-secondary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-black mb-3">BOOKING SUCCESSFUL!</h1>
          <p className="text-white/50 text-sm uppercase tracking-widest">Your arena is locked and loaded.</p>
        </div>

        {/* High Performance Holographic Ticket */}
        <motion.div
          ref={ticketRef}
          whileHover={{ y: -5 }}
          className="relative bg-white/5 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border border-white/10 p-8 shadow-2xl"
        >
          {/* Ticket Top Section */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Trophy className="text-primary w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">ARENA</div>
                <div className="text-xl font-display font-bold">KGF ARENA</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">OFFICIAL PASS</div>
              <div className="font-mono text-xs text-white/40">{bookingId}</div>
            </div>
          </div>

          {/* Ticket Main Info */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> DATE
                </div>
                <div className="text-lg font-bold">
                  {booking ? new Date(booking.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase() : 'LOADING...'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> TIME
                </div>
                <div className="text-lg font-bold text-primary">
                  {booking ? formatSlots(booking.slots) : 'LOADING...'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" /> LOCATION
                </div>
                <div className="text-lg font-bold">KGF ARENA GROUND</div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl">
              <QRCodeSVG 
                value={bookingId} 
                size={100}
                level="H"
                includeMargin={false}
              />
              <div className="text-[8px] text-black font-bold mt-2 tracking-widest">SCAN AT ENTRY</div>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="border-t border-white/10 pt-8 flex justify-between items-center">
            <div className="flex gap-3">
              <motion.button 
                onClick={handleDownload}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Download Pass"
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <motion.button 
                onClick={handleShare}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Share Pass"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
              <motion.button 
                onClick={handleMap}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                title="Navigate"
              >
                <Navigation className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/30 leading-relaxed max-w-[150px]">
                Show this QR code at the reception to confirm your entry.
              </p>
            </div>
          </div>

          {/* Decorative Cutouts */}
          <div className="absolute top-1/2 -left-4 w-8 h-8 bg-secondary rounded-full -translate-y-1/2" />
          <div className="absolute top-1/2 -right-4 w-8 h-8 bg-secondary rounded-full -translate-y-1/2" />
        </motion.div>

        <motion.button
          onClick={onBack}
          whileHover={{ x: 5 }}
          className="mt-12 flex items-center gap-2 text-white/40 hover:text-primary transition-all mx-auto font-bold text-sm tracking-widest"
        >
          BACK TO HOME <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
}
