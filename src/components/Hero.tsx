import { motion } from 'motion/react';
import { Trophy, Zap, ChevronRight } from 'lucide-react';

export default function Hero({ onStartBooking }: { onStartBooking: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden pt-20 text-center">
      {/* High Performance Particles - CSS Based */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-10%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center z-10"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8 text-primary text-xs font-bold tracking-[0.2em]"
        >
          <Zap className="w-3 h-3 fill-primary" />
          <span>ELITE PERFORMANCE ARENA</span>
        </motion.div>

        <h2 className="text-2xl md:text-3xl font-display font-medium text-white/50 mb-2 uppercase tracking-[0.2em] drop-shadow-md">
          Kerala Game field
        </h2>
        
        <h1 className="text-7xl md:text-9xl font-display font-black tracking-tighter mb-6 leading-none">
          BOOK YOUR <br />
          <span className="text-primary italic relative">
            MATCH
            <motion.span 
              className="absolute -bottom-2 left-0 w-full h-2 bg-primary/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-12 font-medium">
          Experience professional-grade turf with cinematic lighting. 
          Fast, smooth, and ready for your game.
        </p>

        <motion.button
          onClick={onStartBooking}
          whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 255, 136, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="group relative px-10 py-5 bg-primary text-secondary font-black text-lg rounded-2xl overflow-hidden transition-all"
        >
          <span className="relative z-10 flex items-center gap-2">
            BOOK NOW <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </span>
          <motion.div
            className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
          />
        </motion.button>
      </motion.div>

      {/* Performance Optimized Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 blur-[120px] rounded-full animate-pulse" />
    </section>
  );
}
