import { motion } from 'motion/react';
import { Zap, Shield, Coffee, Car, Waves, Users } from 'lucide-react';

const FACILITIES = [
  { icon: Zap, name: "PRO FLOODLIGHTS", desc: "Cinematic night match experience" },
  { icon: Shield, name: "PREMIUM TURF", desc: "FIFA/ICC standard artificial grass" },
  { icon: Coffee, name: "CAFE & LOUNGE", desc: "Refreshments for players & fans" },
  { icon: Car, name: "VALET PARKING", desc: "Secure space for your vehicles" },
  { icon: Waves, name: "SHOWER ROOMS", desc: "Clean & modern changing facilities" },
  { icon: Users, name: "FAN STANDS", desc: "Comfortable seating for spectators" },
];

export default function Facilities() {
  return (
    <section className="py-24 px-4 bg-black/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-black mb-4">ELITE <span className="text-primary">FACILITIES</span></h2>
          <p className="text-white/40 uppercase tracking-[0.3em] text-sm">More than just a game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FACILITIES.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl glass-morphism group hover:neon-border transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-secondary transition-all">
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{item.name}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
