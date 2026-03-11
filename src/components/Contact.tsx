import { motion } from 'motion/react';
import { MapPin, Phone, Navigation } from 'lucide-react';

export default function Contact() {
  const handleCall = () => {
    window.location.href = 'tel:7012793080';
  };

  const handleMap = () => {
    window.open('https://maps.google.com/?q=KGF+Arena+Turf', '_blank');
  };

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="glass-morphism rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black mb-1">FIND US</h3>
              <p className="text-white/60 text-sm">Near Central Hub, KGF Arena Ground</p>
              <div className="flex items-center gap-2 mt-2 text-primary text-xs font-bold tracking-widest">
                <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                OPEN NOW
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <motion.button
              onClick={handleCall}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all font-bold"
            >
              <Phone className="w-5 h-5" />
              <span>CALL US</span>
            </motion.button>
            
            <motion.button
              onClick={handleMap}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 md:flex-none px-6 py-4 bg-primary text-secondary rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all font-black"
            >
              <Navigation className="w-5 h-5" />
              <span>NAVIGATE</span>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
}
