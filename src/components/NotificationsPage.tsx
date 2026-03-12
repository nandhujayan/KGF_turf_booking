import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bell, Calendar, Clock, CheckCircle2, Gift, Info, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationsPageProps {
  user: any;
}

interface NotificationRow {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  booking: { icon: CheckCircle2, color: 'text-primary bg-primary/10 border-primary/20' },
  reminder: { icon: Clock, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  promo: { icon: Gift, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  system: { icon: Info, color: 'text-white/40 bg-white/5 border-white/10' },
  completed: { icon: Zap, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
};

const getTimeLabel = (ts: string) => {
  const time = new Date(ts);
  const diff = Date.now() - time.getTime();
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
  return format(time, 'MMM d, h:mm a');
};

export default function NotificationsPage({ user }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/user/${user.id}/notifications`)
        .then(r => r.json())
        .then(data => { setNotifications(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [user]);

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await fetch(`/api/user/${user.id}/notifications/read-all`, { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="pt-32 px-4 pb-20 max-w-2xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
          <Bell className="text-primary w-7 h-7" /> NOTIFICATIONS
          {unreadCount > 0 && (
            <span className="bg-primary text-secondary text-xs font-black px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-[10px] font-black text-white/40 hover:text-primary transition-colors uppercase tracking-widest">
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-24 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
          <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/30 font-bold tracking-widest uppercase text-sm">No notifications yet.</p>
          <p className="text-white/20 text-xs mt-2">They'll appear here after you make a booking.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || typeConfig.system;
            const Icon = cfg.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => !notif.is_read && markRead(notif.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all ${
                  notif.is_read
                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                    : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl border flex items-center justify-center ${cfg.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-black text-sm text-white">{notif.title}</div>
                    {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-white/50 text-xs mt-1 leading-relaxed">{notif.message}</p>
                  <div className="text-[10px] text-white/30 font-bold mt-2 uppercase tracking-widest">
                    {getTimeLabel(notif.created_at)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
