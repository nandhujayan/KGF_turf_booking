import { motion, AnimatePresence } from 'motion/react';
import { Trophy, User, Menu, X, Bell, Download } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  user: any;
  onLoginClick: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Header({ user, onLoginClick, onNavigate, onLogout }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Capture PWA install prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('To install: tap the Share button in your browser then "Add to Home Screen"');
    }
  };

  // Close on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    const handleScroll = () => {
      setShowProfileMenu(false);
      setIsMenuOpen(false);
    };

    if (showProfileMenu || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showProfileMenu, isMenuOpen]);

  const navigate = (page: string) => {
    onNavigate(page);
    setShowProfileMenu(false);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-lg">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('home')}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.3)] group-hover:scale-105 transition-transform">
            <Trophy className="text-secondary w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-display font-black tracking-tighter block leading-none">KGF</span>
            <span className="text-[10px] font-bold text-primary tracking-[0.3em] block leading-none">ARENA</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {['HOME', 'BOOK', 'FACILITIES', 'CONTACT'].map((item) => (
            <button 
              key={item}
              onClick={() => navigate(item.toLowerCase())}
              className="text-xs font-bold text-white/60 hover:text-primary tracking-widest transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {/* Install App Button */}
          <button
            onClick={handleInstall}
            title="Add to Home Screen"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all text-white/40"
          >
            <Download className="w-4 h-4" />
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <span className="text-xs font-bold text-white hidden sm:block max-w-[80px] truncate">{user.name}</span>
                <div className="w-8 h-8 rounded-full bg-primary text-secondary flex items-center justify-center font-bold uppercase flex-shrink-0">
                  {user.name?.[0] || 'U'}
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-52 bg-[#0d1425] border border-white/10 rounded-2xl overflow-hidden shadow-2xl py-2 z-[200]"
                  >
                    {/* User badge */}
                    <div className="px-4 py-3 border-b border-white/10 mb-1">
                      <div className="text-xs font-black text-white truncate">{user.name}</div>
                      <div className="text-[10px] text-white/40 truncate">{user.email || user.phone}</div>
                    </div>
                    <button 
                      onClick={() => { navigate('profile'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-primary flex items-center gap-3 transition-colors"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button 
                      onClick={() => { navigate('notifications'); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-primary flex items-center gap-3 transition-colors"
                    >
                      <Bell className="w-4 h-4" /> Notifications
                    </button>
                    <button
                      onClick={handleInstall}
                      className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-primary flex items-center gap-3 transition-colors sm:hidden"
                    >
                      <Download className="w-4 h-4" /> Add to Home Screen
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button 
                      onClick={() => { onLogout(); setShowProfileMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="px-6 py-2.5 rounded-full bg-primary text-secondary text-xs font-black hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all"
            >
              LOGIN
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-white/60 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="absolute top-24 left-4 right-4 bg-[#0d1425] border border-white/10 rounded-2xl p-4 shadow-2xl md:hidden z-[200]"
          >
            <div className="flex flex-col gap-1">
              {['HOME', 'BOOK', 'FACILITIES', 'CONTACT'].map((item) => (
                <button 
                  key={item}
                  onClick={() => navigate(item.toLowerCase())}
                  className="p-3 text-left text-sm font-bold text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-all"
                >
                  {item}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
