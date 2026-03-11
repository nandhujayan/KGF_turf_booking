import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin, MessageSquare, X } from 'lucide-react';

export default function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="absolute bottom-full right-0 mb-4 flex flex-col gap-3 items-center"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.open('https://maps.google.com/?q=KGF+Arena+Turf', '_blank')}
              className="w-12 h-12 bg-[#0a0f1c] border border-primary/30 text-primary rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl"
            >
              <MapPin className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => window.location.href = 'tel:7012793080'}
              className="w-12 h-12 bg-[#0a0f1c] border border-primary/30 text-primary rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl"
            >
              <Phone className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-colors ${
          isOpen ? 'bg-red-500 text-white' : 'bg-primary text-secondary'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}
