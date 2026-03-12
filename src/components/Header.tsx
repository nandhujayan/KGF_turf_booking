import { motion } from 'motion/react';
import { Trophy, User, Calendar, Menu, X } from 'lucide-react';
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto bg-[#0a0f1c]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-3 flex justify-between items-center shadow-lg">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('home')}
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
              onClick={() => onNavigate(item.toLowerCase())}
              className="text-xs font-bold text-white/60 hover:text-primary tracking-widest transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <span className="text-xs font-bold text-white hidden sm:block">{user.name}</span>
                <div className="w-8 h-8 rounded-full bg-primary text-secondary flex items-center justify-center font-bold uppercase">
                  {user.name?.[0] || 'U'}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0f1c] border border-white/10 rounded-xl overflow-hidden shadow-xl py-2">
                  <button 
                    onClick={() => {
                      onNavigate('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-primary flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> My Profile
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('bookings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-primary flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" /> My Bookings
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button 
                    onClick={() => {
                      onLogout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                  >
                    Logout
                  </button>
                </div>
              )}
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
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-4 right-4 bg-[#0a0f1c] border border-white/10 rounded-2xl p-4 shadow-2xl md:hidden"
        >
          <div className="flex flex-col gap-2">
            {['HOME', 'BOOK', 'FACILITIES', 'CONTACT'].map((item) => (
              <button 
                key={item}
                onClick={() => {
                  onNavigate(item.toLowerCase());
                  setIsMenuOpen(false);
                }}
                className="p-3 text-left text-sm font-bold text-white/60 hover:text-primary hover:bg-white/5 rounded-xl transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </header>
  );
}
