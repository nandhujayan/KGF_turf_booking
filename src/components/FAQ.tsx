import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "WHAT ARE THE OPERATING HOURS?",
    answer: "KGF Arena is open 24/7. However, peak hours are usually from 4:00 PM to 11:00 PM. You can book any available slot through our real-time booking system."
  },
  {
    question: "DO YOU PROVIDE EQUIPMENT?",
    answer: "Yes! We provide high-quality footballs and cricket kits (bats, balls, and basic protective gear) for free with every booking. Professional kits are also available for rent."
  },
  {
    question: "WHAT IS THE CANCELLATION POLICY?",
    answer: "Cancellations made 24 hours before the slot are eligible for a full refund. Within 24 hours, you can reschedule your slot once for free, subject to availability."
  },
  {
    question: "IS THERE A PARKING FACILITY?",
    answer: "We have a dedicated parking area that can accommodate up to 50 cars and 100 bikes, completely free for our players."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 bg-black/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">Common Queries</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-4">
            FREQUENTLY ASKED <span className="text-primary italic">QUESTIONS</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="glass-morphism rounded-3xl border border-white/5 overflow-hidden"
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full p-6 md:p-8 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-sm md:text-lg font-display font-bold tracking-tight">{faq.question}</span>
                <div className={`p-2 rounded-full transition-all duration-300 ${activeIndex === index ? 'bg-primary text-secondary rotate-180' : 'bg-white/5 text-white'}`}>
                  {activeIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 md:px-8 pb-8 text-white/50 text-sm md:text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
