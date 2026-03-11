import { motion } from 'motion/react';
import { Sparkles, Users, Gift, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Subscriptions() {
  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest mb-6"
        >
          <Sparkles className="w-4 h-4" />
          <span>ELITE MEMBERSHIP</span>
        </motion.div>
        <h2 className="text-5xl font-display font-black mb-6 uppercase">LEVEL UP YOUR <span className="text-primary italic">GAME</span></h2>
        <p className="text-white/40 max-w-2xl mx-auto">
          Join our subscription plans to unlock exclusive discounts, priority bookings, and free tournament entries.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Referral Program */}
        <motion.div
          whileHover={{ y: -10 }}
          className="md:col-span-1 p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col"
        >
          <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center mb-8">
            <Gift className="w-7 h-7 text-accent" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-4">REFER & EARN</h3>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Invite your friends to play at StadiumX. Get ₹200 wallet credit for every friend who completes their first booking.
          </p>
          <div className="mt-auto">
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/20 mb-6 flex justify-between items-center">
              <span className="text-xs font-mono text-white/60">STX-REFER-2026</span>
              <button className="text-xs font-bold text-primary hover:underline">COPY</button>
            </div>
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
              INVITE TEAMMATES <Users className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Subscription Plans */}
        {[
          { 
            name: "PRO PLAYER", 
            price: "₹1,999", 
            period: "/month",
            color: "primary",
            features: ["15% Off all bookings", "Priority peak hour access", "2 Free guest passes", "Monthly tournament entry"]
          },
          { 
            name: "ELITE TEAM", 
            price: "₹4,999", 
            period: "/month",
            color: "accent",
            features: ["30% Off all bookings", "Unlimited peak access", "5 Free guest passes", "Free team jersey kit", "Dedicated coach session"]
          }
        ].map((plan, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -10 }}
            className={`p-8 rounded-3xl bg-white/5 border ${plan.color === 'primary' ? 'border-primary/30 shadow-[0_0_40px_rgba(0,255,136,0.05)]' : 'border-accent/30'} flex flex-col`}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className={`text-sm font-bold tracking-[0.2em] mb-2 ${plan.color === 'primary' ? 'text-primary' : 'text-accent'}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-black">{plan.price}</span>
                  <span className="text-white/40 text-xs">{plan.period}</span>
                </div>
              </div>
              {plan.color === 'primary' && (
                <span className="px-3 py-1 rounded-full bg-primary text-secondary text-[10px] font-black">POPULAR</span>
              )}
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-sm text-white/60">
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.color === 'primary' ? 'text-primary' : 'text-accent'}`} />
                  {f}
                </li>
              ))}
            </ul>

            <button className={`w-full py-5 rounded-2xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${
              plan.color === 'primary' 
                ? 'bg-primary text-secondary hover:shadow-[0_0_30px_rgba(0,255,136,0.3)]' 
                : 'bg-accent text-secondary hover:shadow-[0_0_30px_rgba(0,234,255,0.3)]'
            }`}>
              GET STARTED <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
