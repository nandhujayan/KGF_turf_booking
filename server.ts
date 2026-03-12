import "dotenv/config";
import dns from "dns";
import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import twilio from "twilio";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Force IPv4 DNS resolution — COMPULSORY for Render free tier to connect to DB
dns.setDefaultResultOrder('ipv4first');

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isRemoteDb = (url?: string) =>
  url?.includes('supabase.co') ||
  url?.includes('neon.tech') ||
  url?.includes('render.com') ||
  url?.includes('dpg-'); // Render internal hostname

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      twilioClient = twilio(accountSid, authToken);
    }
  }
  return twilioClient;
}

async function sendWhatsAppMessage(to: string, body: string) {
  const client = getTwilioClient();
  if (!client) {
    console.warn("Twilio credentials missing. Skipping WhatsApp message.");
    return;
  }
  
  if (typeof to !== 'string') {
    to = String(to);
  }
  
  const rawFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const from = rawFrom.startsWith('whatsapp:') ? rawFrom : `whatsapp:${rawFrom.startsWith('+') ? rawFrom : '+' + rawFrom}`;
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to.startsWith('+') ? to : '+91' + to}`;
  
  let attempts = 0;
  while (attempts < 3) {
    try {
      await client.messages.create({
        body,
        from,
        to: formattedTo
      });
      console.log(`WhatsApp message sent to ${formattedTo}`);
      return;
    } catch (error) {
      attempts++;
      console.error(`Failed to send WhatsApp message to ${formattedTo} (Attempt ${attempts}/3):`, error);
      if (attempts >= 3) {
        console.error(`Final failure sending WhatsApp message to ${formattedTo}`);
      }
    }
  }
}

// Initialize Database
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        phone TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        photo TEXT,
        is_blocked INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE,
        discount_percent INTEGER,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      -- Initial settings
      INSERT INTO settings (key, value) VALUES ('maintenance_mode', 'false') ON CONFLICT (key) DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('turf_name', 'KGF Arena') ON CONFLICT (key) DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('price_per_hour', '1200') ON CONFLICT (key) DO NOTHING;
      INSERT INTO settings (key, value) VALUES ('contact_phone', '7012793080') ON CONFLICT (key) DO NOTHING;

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        user_name TEXT,
        sport TEXT,
        date TEXT,
        slots TEXT,
        total_price INTEGER,
        status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, locked
        locked_at TIMESTAMP,
        rating INTEGER DEFAULT 0,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Add columns if table already exists
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 0;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS blocked_slots (
        id SERIAL PRIMARY KEY,
        sport TEXT,
        date TEXT,
        slot_id TEXT,
        reason TEXT
      );

      CREATE TABLE IF NOT EXISTS custom_slots (
        id SERIAL PRIMARY KEY,
        sport TEXT,
        time TEXT,
        price INTEGER
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type TEXT,
        title TEXT,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Migration: add new columns to existing tables
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS players TEXT[] DEFAULT '{}';
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id TEXT;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
    `);
    console.log("Database initialized");
  } catch (err) {
    console.error("Database initialization failed", err);
  } finally {
    client.release();
  }
}

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- Auth Routes ---
  app.post("/api/register", async (req, res) => {
    const { name, phone, email, password } = req.body;
    try {
      if (!password) return res.status(400).json({ error: "Password is required" });
      const hash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        "INSERT INTO users (name, phone, email, password) VALUES ($1, $2, $3, $4) RETURNING *",
        [name || 'User', phone, email, hash]
      );
      const user = result.rows[0];
      delete user.password;
      res.json(user);
    } catch (err: any) {
      if (err.code === '23505') {
         return res.status(409).json({ error: "Phone or email already registered" });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body; // identifier can be phone or email
    try {
      const result = await pool.query("SELECT * FROM users WHERE phone = $1 OR email = $1", [identifier]);
      let user = result.rows[0];
      
      if (!user) {
        return res.status(401).json({ error: "User not registered" });
      }

      // Check password
      if (!user.password) {
         // Legacy users might not have a password, you should perhaps migrate them or deny login
         return res.status(401).json({ error: "Please register or reset password" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      delete user.password;
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/user/:id/change-password", async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
      const result = await pool.query("SELECT password FROM users WHERE id = $1", [req.params.id]);
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: "User not found" });
      const match = await bcrypt.compare(oldPassword, user.password);
      if (!match) return res.status(401).json({ error: "Current password is incorrect" });
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters" });
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hash, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/user/:id/update", async (req, res) => {
    const { name, email, phone, photo } = req.body;
    try {
      const result = await pool.query(
        "UPDATE users SET name = $1, email = $2, phone = $3, photo = $4 WHERE id = $5 RETURNING *",
        [name, email, phone, photo, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Update failed" });
    }
  });

  app.get("/api/user/:id/bookings", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/booking/:id", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [req.params.id]);
      const booking = result.rows[0];
      if (booking) {
        res.json(booking);
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // --- Booking Routes ---
  app.post("/api/bookings/:id/rate", async (req, res) => {
    const { rating } = req.body;
    try {
      await pool.query("UPDATE bookings SET rating = $1 WHERE id = $2", [rating, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Rating update failed" });
    }
  });

  app.get("/api/bookings", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings/lock", async (req, res) => {
    const { slots, date, sport, userId } = req.body;
    
    try {
      // Clean up expired locks first (older than 3 mins as requested)
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      await pool.query("DELETE FROM bookings WHERE status = 'locked' AND locked_at < $1", [threeMinutesAgo]);

      // Check if maintenance mode is on
      const maintenanceResult = await pool.query("SELECT value FROM settings WHERE key = 'maintenance_mode'");
      const maintenance = maintenanceResult.rows[0];
      if (maintenance?.value === 'true') {
        return res.status(503).json({ error: "Arena is under maintenance" });
      }

      // Check if any slot is already booked or locked (within last 10 mins) regardless of sport
      const lockedOrBookedResult = await pool.query(`
        SELECT * FROM bookings 
        WHERE date = $1 AND status IN ('confirmed', 'locked')
      `, [date]);
      const lockedOrBooked = lockedOrBookedResult.rows;

      const isConflict = lockedOrBooked.some((b: any) => {
        // If it's my own lock, it's not a conflict (we will replace it)
        if (b.status === 'locked' && b.user_id == userId) return false;

        const bookedSlots = JSON.parse(b.slots);
        const hasOverlap = bookedSlots.some((s: string) => slots.includes(s));
        return hasOverlap;
      });

      if (isConflict) {
        return res.status(409).json({ error: "One or more slots are unavailable" });
      }

      // Delete any existing locks for this user on this date that overlap with requested slots
      if (userId) {
        const userLocksResult = await pool.query(
          "SELECT * FROM bookings WHERE user_id = $1 AND date = $2 AND status = 'locked'",
          [userId, date]
        );
        const userLocks = userLocksResult.rows;
        for (const lock of userLocks) {
          const lockSlots = JSON.parse(lock.slots);
          if (lockSlots.some((s: string) => slots.includes(s))) {
            await pool.query("DELETE FROM bookings WHERE id = $1", [lock.id]);
          }
        }
      }

      // Let's insert a locked record
      const lockId = `LOCK-${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(`
        INSERT INTO bookings (id, user_id, user_name, sport, date, slots, total_price, status, locked_at)
        VALUES ($1, $2, 'System Lock', $3, $4, $5, 0, 'locked', $6)
      `, [lockId, userId || 0, sport, date, JSON.stringify(slots), new Date()]);

      res.json({ success: true, lockId });
    } catch (err) {
      console.error("Locking failed", err);
      res.status(500).json({ error: "Locking failed" });
    }
  });

  app.post("/api/bookings/unlock", async (req, res) => {
    const { lockId } = req.body;
    try {
      if (lockId) {
        await pool.query("DELETE FROM bookings WHERE id = $1 AND status = 'locked'", [lockId]);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Unlock failed" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    const { id, userId, userName, sport, date, slots, totalPrice, lockId } = req.body;
    
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      // If a lock exists, remove it first
      if (lockId) {
        await client.query("DELETE FROM bookings WHERE id = $1", [lockId]);
      }
      
      await client.query(`
        INSERT INTO bookings (id, user_id, user_name, sport, date, slots, total_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
      `, [id, userId, userName, sport, date, JSON.stringify(slots), totalPrice]);
      
      const userResult = await client.query("SELECT phone FROM users WHERE id = $1", [userId]);
      const userPhone = userResult.rows[0]?.phone;

      // Insert booking confirmation notification
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'booking', $2, $3)
      `, [userId, '\u2705 Booking Confirmed!', `Your ${sport} slot on ${date} has been confirmed.`]);

      const SLOTS_MAP: Record<string, string> = {
        '06-07': '06:00 AM', '07-08': '07:00 AM', '08-09': '08:00 AM',
        '09-10': '09:00 AM', '10-11': '10:00 AM', '16-17': '04:00 PM',
        '17-18': '05:00 PM', '18-19': '06:00 PM', '19-20': '07:00 PM',
        '20-21': '08:00 PM', '21-22': '09:00 PM', '22-23': '10:00 PM'
      };
      const formattedSlots = slots.map((s: string) => SLOTS_MAP[s] || s).join(', ');

      const userMessage = `✅ Booking Confirmed!

🏟 Turf: KGF Arena
🏏/⚽ Sport: ${sport}
📅 Date: ${date}
⏰ Time Slot: ${formattedSlots}

📍 Location: https://maps.google.com/?q=KGF+Arena+Turf

Please arrive 10 minutes early.
Show your QR booking pass at the entrance.

Thank you for booking with KGF Arena!`;

      const adminMessage = `📢 New Booking Alert

User: ${userName}
Sport: ${sport}
Date: ${date}
Time: ${formattedSlots}`;

      if (userPhone) {
        sendWhatsAppMessage(userPhone, userMessage).catch(console.error);
      }
      const adminPhone = process.env.ADMIN_PHONE || '7012793080';
      sendWhatsAppMessage(adminPhone, adminMessage).catch(console.error);
      
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error) {
      if (client) {
        try { await client.query('ROLLBACK'); } catch (e) {}
      }
      console.error("Booking transaction failed", error);
      res.status(500).json({ error: "Booking failed" });
    } finally {
      if (client) {
        client.release();
      }
    }
  });

  app.post("/api/bookings/cancel", async (req, res) => {
    const { bookingId } = req.body;
    try {
      await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [bookingId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Cancellation failed" });
    }
  });

  // ===== RAZORPAY PAYMENT =====
  app.post("/api/payment/create-order", async (req, res) => {
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Razorpay keys not configured" });
    }
    const { amount, currency = 'INR' } = req.body;
    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${auth}` },
        body: JSON.stringify({ amount, currency, receipt: `rcpt_${Date.now()}` })
      });
      const order = await response.json() as any;
      res.json({ ...order, key: RAZORPAY_KEY_ID });
    } catch (err) {
      console.error("Razorpay order creation failed", err);
      res.status(500).json({ error: "Payment order creation failed" });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!RAZORPAY_KEY_SECRET) return res.status(500).json({ error: "Razorpay not configured" });

    // Verify signature
    const expectedSign = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Create booking
    const { id, userId, userName, sport, date, slots, totalPrice, lockId } = bookingData;
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      if (lockId) await client.query("DELETE FROM bookings WHERE id = $1", [lockId]);
      await client.query(`
        INSERT INTO bookings (id, user_id, user_name, sport, date, slots, total_price, status, payment_id, razorpay_order_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9)
      `, [id, userId, userName, sport, date, JSON.stringify(slots), totalPrice, razorpay_payment_id, razorpay_order_id]);

      // Insert notification
      await client.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'booking', '✅ Booking Confirmed!', $2)
      `, [userId, `Your ${sport} slot on ${date} is confirmed. Payment ID: ${razorpay_payment_id}`]);

      await client.query('COMMIT');
      res.json({ success: true, bookingId: id });
    } catch (err) {
      if (client) try { await client.query('ROLLBACK'); } catch (e) {}
      console.error("Booking after payment failed", err);
      res.status(500).json({ error: "Booking creation failed after payment" });
    } finally {
      if (client) client.release();
    }
  });

  // ===== GOOGLE AUTH =====
  app.post("/api/auth/google", async (req, res) => {
    const { credential } = req.body;
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "Google auth not configured" });
    try {
      // Verify Google ID token
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      const payload = await googleRes.json() as any;
      if (payload.aud !== GOOGLE_CLIENT_ID) return res.status(401).json({ error: "Invalid Google token" });

      const { sub: googleId, email, name, picture } = payload;
      // Upsert user
      const existing = await pool.query("SELECT * FROM users WHERE google_id = $1 OR email = $2", [googleId, email]);
      let user;
      if (existing.rows.length > 0) {
        user = existing.rows[0];
        await pool.query("UPDATE users SET google_id = $1, photo = $2 WHERE id = $3", [googleId, picture, user.id]);
        user.google_id = googleId;
        user.photo = picture;
      } else {
        const result = await pool.query(
          "INSERT INTO users (name, email, google_id, photo) VALUES ($1, $2, $3, $4) RETURNING *",
          [name, email, googleId, picture]
        );
        user = result.rows[0];
      }
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } catch (err) {
      console.error("Google auth failed", err);
      res.status(500).json({ error: "Google authentication failed" });
    }
  });

  // ===== BOOKING PLAYERS =====
  app.get("/api/bookings/:id/players", async (req, res) => {
    try {
      const result = await pool.query("SELECT players FROM bookings WHERE id = $1", [req.params.id]);
      res.json({ players: result.rows[0]?.players || [] });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  app.post("/api/bookings/:id/players", async (req, res) => {
    const { players } = req.body; // string[]
    try {
      await pool.query("UPDATE bookings SET players = $1 WHERE id = $2", [players, req.params.id]);
      res.json({ success: true, players });
    } catch (err) {
      res.status(500).json({ error: "Failed to update players" });
    }
  });

  // ===== NOTIFICATIONS =====
  app.get("/api/user/:id/notifications", async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
        [req.params.id]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark as read" });
    }
  });

  app.post("/api/user/:id/notifications/read-all", async (req, res) => {
    try {
      await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to mark all as read" });
    }
  });

  // --- Admin Routes ---

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
    const ADMIN_PASS = process.env.ADMIN_PASSWORD || "12345";
    
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      res.json({ success: true, token: "admin-token-123" });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const bookingsResult = await pool.query("SELECT * FROM bookings WHERE status = 'confirmed'");
      const bookings = bookingsResult.rows;
      const usersResult = await pool.query("SELECT COUNT(*) as count FROM users");
      const usersCount = parseInt(usersResult.rows[0].count);
      
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStr = todayStr.substring(0, 7); // YYYY-MM

      const todayBookings = bookings.filter(b => b.date === todayStr);
      const monthBookings = bookings.filter(b => b.date.startsWith(monthStr));

      const todayRevenue = todayBookings.reduce((sum, b) => sum + b.total_price, 0);
      const monthRevenue = monthBookings.reduce((sum, b) => sum + b.total_price, 0);

      // Revenue per day
      const revenueByDate = bookings.reduce((acc: any, b: any) => {
        const date = b.date;
        acc[date] = (acc[date] || 0) + b.total_price;
        return acc;
      }, {});

      // Bookings per sport
      const bookingsBySport = bookings.reduce((acc: any, b: any) => {
        const sport = b.sport;
        acc[sport] = (acc[sport] || 0) + 1;
        return acc;
      }, {});

      const revenueData = Object.entries(revenueByDate).map(([date, amount]) => ({ date, amount }));
      const sportData = Object.entries(bookingsBySport).map(([name, value]) => ({ name, value }));

      const slotsCount = bookings.reduce((acc: any, b: any) => {
        try {
          const slots = JSON.parse(b.slots);
          slots.forEach((s: string) => acc[s] = (acc[s] || 0) + 1);
        } catch(e) {}
        return acc;
      }, {});
      const popularSlots = Object.entries(slotsCount)
        .map(([slot, count]) => ({ slot, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      res.json({ 
        revenueData, 
        sportData, 
        popularSlots,
        recentBookings,
        totalBookings: bookings.length,
        totalUsers: usersCount,
        todayRevenue,
        monthRevenue,
        todayBookingsCount: todayBookings.length,
        monthBookingsCount: monthBookings.length
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/block", async (req, res) => {
    const { userId, blocked } = req.body;
    try {
      await pool.query("UPDATE users SET is_blocked = $1 WHERE id = $2", [blocked ? 1 : 0, userId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  app.post("/api/admin/users/delete", async (req, res) => {
    const { userId } = req.body;
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/admin/settings", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM settings");
      const settingsObj = result.rows.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      res.json(settingsObj);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    const { settings } = req.body;
    try {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
          [key, String(value)]
        );
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/admin/bookings/verify", async (req, res) => {
    const { bookingId } = req.body;
    try {
      const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [bookingId]);
      const booking = result.rows[0];
      if (booking) {
        // Mark as completed upon successful scan/verify
        if (!booking.is_completed) {
          await pool.query("UPDATE bookings SET is_completed = TRUE WHERE id = $1", [bookingId]);
          booking.is_completed = true;
        }
        res.json({ success: true, booking });
      } else {
        res.status(404).json({ error: "Booking not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/admin/promo-codes", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM promo_codes");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", async (req, res) => {
    const { code, discountPercent } = req.body;
    try {
      await pool.query("INSERT INTO promo_codes (code, discount_percent) VALUES ($1, $2)", [code, discountPercent]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to add promo code" });
    }
  });

  app.post("/api/admin/bookings/cancel-slot", async (req, res) => {
    const { date, slotId } = req.body;
    try {
      await pool.query("UPDATE bookings SET status = 'cancelled' WHERE date = $1 AND slots LIKE $2", [date, `%${slotId}%`]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to cancel slot" });
    }
  });

  app.post("/api/admin/slots/delete", async (req, res) => {
    const { time } = req.body;
    try {
      await pool.query("DELETE FROM custom_slots WHERE time = $1", [time]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete slot" });
    }
  });

  app.post("/api/admin/slots/update", async (req, res) => {
    const { id, time, price } = req.body;
    try {
      await pool.query("UPDATE custom_slots SET time = $1, price = $2 WHERE id = $3", [time, price, id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update slot" });
    }
  });

  app.post("/api/promo/apply", async (req, res) => {
    const { code } = req.body;
    try {
      const result = await pool.query("SELECT * FROM promo_codes WHERE code = $1 AND is_active = 1", [code]);
      const promo = result.rows[0];
      if (promo) {
        res.json({ success: true, discountPercent: promo.discount_percent });
      } else {
        res.status(404).json({ error: "Invalid or inactive promo code" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to apply promo code" });
    }
  });

  app.get("/api/admin/bookings", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.get("/api/blocked-slots", async (req, res) => {
    const { date, userId } = req.query;
    
    try {
      // 1. Get Admin Blocked Slots
      const adminBlockedResult = await pool.query("SELECT slot_id FROM blocked_slots WHERE date = $1", [date]);
      const adminBlocked = adminBlockedResult.rows;
      
      // 2. Get User Booked/Locked Slots
      const userBookedResult = await pool.query(`
        SELECT user_id, slots, status, locked_at FROM bookings 
        WHERE date = $1 AND status IN ('confirmed', 'locked')
      `, [date]);
      const userBooked = userBookedResult.rows;

      const bookedSlotIds = new Set<string>();

      // Add admin blocked slots
      adminBlocked.forEach((b: any) => bookedSlotIds.add(b.slot_id));

      // Add user booked slots
      userBooked.forEach((b: any) => {
        // If it's my own lock, don't show as blocked
        if (b.status === 'locked' && b.user_id == userId) return;

        // Check lock expiry (3 mins)
        if (b.status === 'locked') {
          const lockTime = new Date(b.locked_at).getTime();
          if (Date.now() - lockTime > 3 * 60 * 1000) return; // Expired
        }
        
        const slots = JSON.parse(b.slots);
        slots.forEach((s: string) => bookedSlotIds.add(s));
      });

      res.json(Array.from(bookedSlotIds));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch blocked slots" });
    }
  });

  app.post("/api/admin/block-slot", async (req, res) => {
    const { sport, date, slotId, reason } = req.body;
    try {
      await pool.query(
        "INSERT INTO blocked_slots (sport, date, slot_id, reason) VALUES ($1, $2, $3, $4)",
        [sport, date, slotId, reason]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to block slot" });
    }
  });

  app.post("/api/admin/unblock-slot", async (req, res) => {
    const { sport, date, slotId } = req.body;
    try {
      await pool.query(
        "DELETE FROM blocked_slots WHERE sport = $1 AND date = $2 AND slot_id = $3",
        [sport, date, slotId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to unblock slot" });
    }
  });

  app.get("/api/slots", async (req, res) => {
    // We get all custom slots and filter on frontend for simplicity
    try {
      const result = await pool.query("SELECT * FROM custom_slots");
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch slots" });
    }
  });

  app.post("/api/admin/slots/update", async (req, res) => {
    const { id, time, price } = req.body;
    try {
      // Upsert based on time acting as the identifier
      const exists = await pool.query("SELECT * FROM custom_slots WHERE time = $1", [time]);
      if (exists.rows.length > 0) {
        await pool.query("UPDATE custom_slots SET price = $1 WHERE time = $2", [price, time]);
      } else {
        await pool.query("INSERT INTO custom_slots (sport, time, price) VALUES ($1, $2, $3)", ['all', time, price]);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update slot" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
