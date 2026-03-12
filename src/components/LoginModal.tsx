import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Phone, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoginView) {
      // Basic Validation for Registration
      if (!name || name.trim().length < 3) {
        return setError("Please enter a valid name");
      }
      if (!phone || phone.replace(/\D/g,'').length < 10) {
        return setError("Please enter a valid 10-digit phone number");
      }
      if (!email || !email.includes('@')) {
        return setError("Please enter a valid email");
      }
      if (!password || password.length < 6) {
        return setError("Password must be at least 6 characters");
      }
    } else {
      if (!identifier || identifier.length < 3) {
        return setError("Please enter a valid email or phone");
      }
      if (!password) {
        return setError("Please enter your password");
      }
    }

    setLoading(true);
    
    try {
      const endpoint = isLoginView ? '/api/login' : '/api/register';
      const body = isLoginView 
        ? { identifier, password }
        : { name, phone, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data);
        resetForm();
        onClose();
      } else {
        if (isLoginView && res.status === 401 && data.error === "User not registered") {
          setIsLoginView(false);
          setError("Account not found. Please register to continue.");
        } else {
          setError(data.error || "Authentication failed");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Sign-In script and render button
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;
    const initGoogle = () => {
      const g = (window as any).google;
      if (!g) return;
      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
      if (googleBtnRef.current) {
        g.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 320,
          text: 'continue_with',
          shape: 'pill',
        });
      }
    };

    if ((window as any).google?.accounts) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, [isOpen, isLoginView]);

  const handleGoogleLogin = async (response: any) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onLogin(data.user);
        resetForm();
        onClose();
      } else {
        setError(data.error || 'Google sign-in failed');
      }
    } catch {
      setError('Network error during Google sign-in');
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifier('');
    setPhone('');
    setEmail('');
    setName('');
    setPassword('');
    setError('');
    setIsLoginView(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-[#0a0f1c] border border-white/10 rounded-3xl p-8 overflow-hidden"
          >
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-black mb-2 uppercase">{isLoginView ? 'WELCOME BACK' : 'JOIN EXPERIENCES'}</h2>
              <p className="text-white/40 text-sm">{isLoginView ? 'Login to your account' : 'Create an account to book your slot'}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center p-3 rounded-xl mb-6 font-bold uppercase tracking-widest">
                {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            {GOOGLE_CLIENT_ID && (
              <div className="mb-4">
                {googleLoading ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-white/40 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in with Google...
                  </div>
                ) : (
                  <div ref={googleBtnRef} className="w-full flex justify-center" />
                )}
                <div className="relative flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {!isLoginView && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </>
              )}

              {isLoginView && (
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Email or Phone</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter email or phone number"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-primary transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-secondary font-black rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isLoginView ? 'LOGIN' : 'CREATE ACCOUNT'} <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setIsLoginView(!isLoginView)}
                  className="text-xs text-white/40 hover:text-white transition-colors"
                >
                  {isLoginView ? "Don't have an account? Register" : "Already have an account? Login"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
