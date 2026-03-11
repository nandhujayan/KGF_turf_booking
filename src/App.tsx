import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Stadium3D from './components/Stadium3D';
import Hero from './components/Hero';
import SportSelector from './components/SportSelector';
import BookingSystem from './components/BookingSystem';
import Facilities from './components/Facilities';
import Confirmation from './components/Confirmation';
import AdminDashboard from './pages/AdminDashboard';
import Subscriptions from './components/Subscriptions';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import UserProfile from './components/UserProfile';
import Contact from './components/Contact';
import FloatingContact from './components/FloatingContact';
import FAQ from './components/FAQ';
import WeatherWidget from './components/WeatherWidget';
import type { Sport } from './types';
import { Trophy, Phone, Instagram, Twitter, Mail, ShieldCheck, MapPin } from 'lucide-react';

type AppState = 'home' | 'booking' | 'confirmation' | 'admin' | 'profile' | 'bookings';

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [lastBookingId, setLastBookingId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Scroll to top on state change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state]);

  const handleStartBooking = () => {
    const selector = document.getElementById('sport-selector');
    selector?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSportSelect = (sport: Sport) => {
    setSelectedSport(sport);
    setState('booking');
  };

  const handleBookingComplete = (bookingId: string) => {
    setLastBookingId(bookingId);
    setState('confirmation');
  };

  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
      {/* High Performance 3D - Only on Home */}
      {state === 'home' && <Stadium3D />}
      
      <Header 
        user={user} 
        onLoginClick={() => setShowLogin(true)} 
        onNavigate={(page) => {
          if (['home', 'book', 'facilities', 'contact'].includes(page)) {
            setState('home');
            setTimeout(() => {
              if (page === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                const elementId = page === 'book' ? 'sport-selector' : page;
                document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          } else {
            setState(page as AppState);
          }
        }}
        onLogout={() => setUser(null)}
      />

      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
        onLogin={setUser} 
      />

      <main>
        <AnimatePresence mode="wait">
          {state === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onStartBooking={handleStartBooking} />
              
              <div id="sport-selector">
                <SportSelector selected={selectedSport} onSelect={handleSportSelect} />
              </div>

              <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="max-w-md">
                  <h2 className="text-3xl font-display font-black mb-4 tracking-tight">PLAN YOUR <span className="text-primary italic">MATCH</span> BETTER</h2>
                  <p className="text-white/40 text-sm leading-relaxed">Check the real-time weather at KGF Arena before you book. We ensure perfect playing conditions with our advanced drainage and lighting systems.</p>
                </div>
                <WeatherWidget />
              </div>

              <div id="facilities">
                <Facilities />
              </div>
              
              <Subscriptions />
              
              <FAQ />
              
              <div id="contact">
                <Contact />
              </div>
              
              {/* Footer */}
              <footer className="bg-black/40 py-24 px-8 border-t border-white/5">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Trophy className="text-secondary w-6 h-6" />
                      </div>
                      <span className="text-2xl font-display font-black tracking-tighter">KGF<span className="text-primary italic">ARENA</span></span>
                    </div>
                    <p className="text-white/30 max-w-sm mb-10 leading-relaxed">
                      The ultimate destination for sports enthusiasts. Premium turfs, cinematic lighting, and an elite community.
                    </p>
                    <div className="flex gap-4">
                      {[Instagram, Twitter, Mail].map((Icon, i) => (
                        <button key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-secondary transition-all">
                          <Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-display font-bold mb-8 tracking-[0.3em] text-white">QUICK LINKS</h4>
                    <ul className="space-y-5 text-white/30 text-sm">
                      <li className="hover:text-primary cursor-pointer transition-colors">About Arena</li>
                      <li className="hover:text-primary cursor-pointer transition-colors">Elite Turfs</li>
                      <li className="hover:text-primary cursor-pointer transition-colors">Pricing Plans</li>
                      <li className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</li>
                      <li 
                        onClick={() => setState('admin')}
                        className="hover:text-primary cursor-pointer transition-colors font-bold text-white/50"
                      >
                        Admin Login
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-display font-bold mb-8 tracking-[0.3em] text-white">CONTACT</h4>
                    <ul className="space-y-5 text-white/30 text-sm">
                      <li className="flex items-center gap-3"><Phone className="w-4 h-4" /> +91 70127 93080</li>
                      <li className="flex items-center gap-3"><Mail className="w-4 h-4" /> play@kgfarena.com</li>
                      <li className="flex items-center gap-3"><MapPin className="w-4 h-4" /> Near Central Hub, KGF</li>
                    </ul>
                  </div>
                  <div className="flex flex-col items-center md:items-start">
                    <h4 className="text-[10px] font-display font-bold mb-6 tracking-[0.4em] text-white/40 uppercase">POWERED BY</h4>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="group cursor-pointer"
                    >
                      <img 
                        src="/spacebook-logo.png" 
                        alt="Spacebook Logo" 
                        className="h-12 w-auto object-contain brightness-110 contrast-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
                <div className="max-w-6xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-[10px] text-white/20 tracking-[0.3em] font-bold uppercase">
                    © 2026 KGF ARENA. ALL RIGHTS RESERVED.
                  </div>
                  <div className="flex items-center gap-4 opacity-30 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                    <span className="text-[8px] font-black tracking-[0.3em] text-white/40">DESIGNED BY</span>
                    <img 
                      src="/spacebook-logo.png" 
                      alt="Spacebook" 
                      className="h-6 w-auto"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                </div>
              </footer>
            </motion.div>
          )}

          {state === 'booking' && selectedSport && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-32 pb-20"
            >
              <div className="max-w-6xl mx-auto px-4 mb-8">
                <button 
                  onClick={() => setState('home')}
                  className="text-white/30 hover:text-primary transition-colors flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black"
                >
                  ← BACK TO HOME
                </button>
              </div>
              <BookingSystem 
                sport={selectedSport} 
                user={user}
                onComplete={handleBookingComplete} 
                onLoginRequest={() => setShowLogin(true)}
              />
            </motion.div>
          )}

          {state === 'confirmation' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Confirmation bookingId={lastBookingId} onBack={() => setState('home')} />
            </motion.div>
          )}

          {(state === 'profile' || state === 'bookings') && user && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
               <div className="fixed top-24 left-8 z-50">
                <button 
                  onClick={() => setState('home')}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest hover:bg-white/10 transition-all"
                >
                  ← BACK
                </button>
              </div>
              <UserProfile user={user} onUpdateUser={setUser} />
            </motion.div>
          )}

          {state === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="fixed top-24 left-8 z-50">
                <button 
                  onClick={() => setState('home')}
                  className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-widest hover:bg-white/10 transition-all"
                >
                  ← EXIT ADMIN
                </button>
              </div>
              <AdminDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Micro-interactions */}
      <FloatingContact />
    </div>
  );
}
