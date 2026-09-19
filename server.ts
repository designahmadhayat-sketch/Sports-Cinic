import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, Appointment } from './server/db.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Enable CORS and JSON headers for all /api routes
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, X-User-Token');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// In-memory active session stores
const adminSessions = new Map<string, { email: string; loggedAt: number; isOneTime?: boolean; expiresAt?: number }>();
const userSessions = new Map<string, { email: string; userId: string; loggedAt: number }>();

// Strict multi-admin credential validator: ONLY authorized Gmail and matching passwords provided by the clinic administrator
const AUTHORIZED_ADMIN_ACCOUNTS: Array<{ email: string; passwords: string[] }> = [
  {
    email: 'design.ahmadhayat@gmail.com',
    passwords: ['Admin@DrIftikhar2026!', 'dr.iftikhar1122', 'Admin@SPORC2026!', 'sporc1122', 'Admin@DrIrfan2026!', 'dr.irfan1122', 'Admin@DrWaqas2026!', 'dr.waqas1122'],
  },
  {
    email: 'iftikharali@gmail.com',
    passwords: ['dr.iftikhar1122', 'Admin@DrIftikhar2026!', 'sporc1122'],
  },
  {
    email: 'sporcclinic.pk@gmail.com',
    passwords: ['sporc1122', 'Admin@SPORC2026!'],
  },
  {
    email: 'info@sporcclinic.pk',
    passwords: ['sporc1122', 'Admin@SPORC2026!'],
  },
  {
    email: 'irfanchandia@gmail.com',
    passwords: ['dr.irfan1122', 'Admin@DrIrfan2026!'],
  },
  ...(process.env.ADMIN_GMAIL || process.env.ADMIN_EMAIL
    ? [{
        email: (process.env.ADMIN_GMAIL || process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
        passwords: [process.env.ADMIN_PASSWORD || ''].filter(Boolean),
      }]
    : []),
];

const validateAdminCredentials = (emailInput: string, passwordInput: string): { valid: boolean; email: string } => {
  const inputEmail = String(emailInput || '').toLowerCase().trim();
  const inputPassword = String(passwordInput || '');

  if (!inputEmail || !inputPassword) {
    return { valid: false, email: inputEmail };
  }

  const account = AUTHORIZED_ADMIN_ACCOUNTS.find(a => a.email.toLowerCase() === inputEmail);
  if (account && account.passwords.includes(inputPassword)) {
    return { valid: true, email: inputEmail };
  }

  return { valid: false, email: inputEmail };
};

// Admin authentication middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-admin-token'] as string) || '';

  if (!token || !adminSessions.has(token)) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
    return;
  }

  const session = adminSessions.get(token)!;
  if (session.isOneTime && session.expiresAt && Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    res.status(401).json({ 
      error: 'Session expired: Your one-time 5-minute quick admin access has ended. Please sign in with standard administrator credentials.' 
    });
    return;
  }

  next();
};

// Optional / Required user authentication middleware
const getAuthUser = (req: Request) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7).trim() 
    : (req.headers['x-user-token'] as string) || '';

  if (token && userSessions.has(token)) {
    return userSessions.get(token);
  }
  return null;
};

// ==========================================
// ADMIN AUTH & MANAGEMENT API ROUTES
// ==========================================

// Dedicated Admin Login using environment credentials and authorized emails
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const { valid, email: validatedEmail } = validateAdminCredentials(email, password);

  // Secure credential check
  if (valid) {
    const token = crypto.randomBytes(32).toString('hex');
    adminSessions.set(token, { email: validatedEmail, loggedAt: Date.now() });

    res.json({
      success: true,
      token,
      admin: {
        email: validatedEmail,
        name: 'Dr. Iftikhar Ali (Medical Staff Admin)',
        role: 'superadmin',
        clinic: 'SPORC Clinic Rawalpindi',
      },
    });
    return;
  }

  res.status(401).json({ error: 'Invalid admin credentials. Please verify your email and password.' });
});

// ==========================================
// QUICK ADMIN ACCESS PASSCODE (Passcode: sporc1212)
// Allowed ONE TIME (1 Use) for a 5-Minute temporary session. Once used, it locks out.
// ==========================================
const ONE_TIME_ADMIN_PASSCODES = ['sporc1212', 'iftikhar1122', 'sporc2026', 'irfan1212', 'irfanchandia1122'];

app.post('/api/admin/one-time-login', (req: Request, res: Response) => {
  const { passcode, deviceId } = req.body;
  const inputPass = String(passcode || '').trim().toLowerCase();
  const cleanDevId = String(deviceId || '').trim();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  if (!inputPass) {
    res.status(400).json({ error: 'Quick access passcode is required.' });
    return;
  }

  // 1. Check if this device or client has already redeemed the one-time access
  const checkUsage = db.hasUsedOneTimeAccess(cleanDevId, clientIp);
  if (checkUsage.used) {
    const redeemedDate = checkUsage.record?.redeemedAt
      ? new Date(checkUsage.record.redeemedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : 'previously';
    res.status(403).json({
      error: `This quick access passcode was already used on this device (redeemed on ${redeemedDate}). The single-use 5-minute session has ended and is permanently locked. Please sign in with official administrator credentials.`,
      used: true,
      count: checkUsage.count,
      maxAllowed: 1,
      remaining: 0,
      redeemedAt: checkUsage.record?.redeemedAt,
    });
    return;
  }

  // 2. Validate passcode (irfan1212)
  if (!ONE_TIME_ADMIN_PASSCODES.includes(inputPass)) {
    res.status(401).json({
      error: 'Invalid quick access passcode. Please verify the code provided by Dr. Iftikhar Ali.',
    });
    return;
  }

  // 3. Mark redemption (locks access for this device)
  const result = db.redeemOneTimeAccess(cleanDevId, clientIp, userAgent);

  // 4. Generate active administrative session token with strict 5-MINUTE expiry (300,000 ms)
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const sessionDurationMs = 5 * 60 * 1000; // 5 minutes
  const expiresAt = now + sessionDurationMs;

  adminSessions.set(token, {
    email: 'info@sporcclinic.pk',
    loggedAt: now,
    isOneTime: true,
    expiresAt,
  });

  res.json({
    success: true,
    token,
    admin: {
      email: 'info@sporcclinic.pk',
      name: 'Dr. Iftikhar Ali (Quick Admin Access)',
      role: 'admin',
      clinic: 'SPORC Clinic Rawalpindi',
      isOneTimeSession: true,
    },
    message: 'Quick admin access verified! Single-use 5-minute session started.',
    count: 1,
    maxAllowed: 1,
    remaining: 0,
    expiresInSeconds: 300,
    expiresAt: new Date(expiresAt).toISOString(),
    redemption: result.redemption,
  });
});

// Check status of quick access for a device/IP
app.get('/api/admin/one-time-status', (req: Request, res: Response) => {
  const deviceId = String(req.query.deviceId || '').trim();
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
  const status = db.hasUsedOneTimeAccess(deviceId, clientIp);

  res.json({
    used: status.used,
    count: status.count,
    maxAllowed: status.maxAllowed,
    remaining: status.remaining,
    redeemedAt: status.record?.redeemedAt,
  });
});

// Admin-only reset of one-time access (for clinic administrator to re-enable if needed)
app.post('/api/admin/one-time-reset', requireAdmin, (req: Request, res: Response) => {
  const { deviceId } = req.body;
  db.resetOneTimeAccess(deviceId);
  res.json({ success: true, message: 'One-time access reset successfully.' });
});

app.get('/api/admin/one-time-redemptions', requireAdmin, (req: Request, res: Response) => {
  res.json({ redemptions: db.getOneTimeRedemptions() });
});

app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const session = adminSessions.get(token);

  res.json({
    authenticated: true,
    admin: {
      email: session?.email || 'info@sporcclinic.pk',
      name: 'Dr. Iftikhar Ali Clinic Administrator',
      role: 'superadmin',
    },
  });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (token) {
    adminSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Dashboard Real Statistics
app.get('/api/admin/stats', requireAdmin, (req: Request, res: Response) => {
  const stats = db.getStats();
  res.json(stats);
});

// Admin All Appointments (with filters)
app.get('/api/admin/appointments', requireAdmin, (req: Request, res: Response) => {
  const appointments = db.getAppointments();
  const { status, search, doctor } = req.query;

  let filtered = [...appointments];

  if (status && status !== 'all') {
    filtered = filtered.filter(a => a.status.toLowerCase() === String(status).toLowerCase());
  }

  if (doctor && doctor !== 'all') {
    filtered = filtered.filter(a => a.doctor.toLowerCase().includes(String(doctor).toLowerCase()));
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(a =>
      a.fullName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.appointmentType.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }

  res.json({ appointments: filtered, total: filtered.length });
});

// Admin Update Appointment Status
app.put('/api/admin/appointments/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status value' });
    return;
  }

  const updated = db.updateAppointmentStatus(id, status as Appointment['status']);
  if (!updated) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  res.json({ success: true, appointment: updated });
});

// Admin Reschedule Appointment
app.put('/api/admin/appointments/:id/reschedule', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, time } = req.body;

  if (!date || !time) {
    res.status(400).json({ error: 'New date and time are required' });
    return;
  }

  const updated = db.rescheduleAppointment(id, date, time);
  if (!updated) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }

  res.json({ success: true, appointment: updated });
});

// Admin Delete Appointment
app.delete('/api/admin/appointments/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteAppointment(id);
  if (!success) {
    res.status(404).json({ error: 'Appointment not found' });
    return;
  }
  res.json({ success: true, message: 'Appointment deleted successfully' });
});

// Admin Patients & User Directory
app.get('/api/admin/patients', requireAdmin, (req: Request, res: Response) => {
  const users = db.getUsers();
  const appointments = db.getAppointments();

  // Attach appointments history to each patient
  const patientsWithHistory = users.map(user => {
    const userAppointments = appointments.filter(a => a.email.toLowerCase() === user.email.toLowerCase());
    return {
      ...user,
      totalAppointments: userAppointments.length,
      appointments: userAppointments,
    };
  });

  res.json({ patients: patientsWithHistory });
});

// Admin Activity Log (Genuine actions only)
app.get('/api/admin/activity', requireAdmin, (req: Request, res: Response) => {
  const logs = db.getActivityLogs();
  res.json({ activities: logs });
});

// Admin Contact Inquiries
app.get('/api/admin/inquiries', requireAdmin, (req: Request, res: Response) => {
  const inquiries = db.getInquiries();
  res.json({ inquiries });
});

app.put('/api/admin/inquiries/:id/status', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = db.updateInquiryStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: 'Inquiry not found' });
    return;
  }
  res.json({ success: true, inquiry: updated });
});

// ==========================================
// PUBLIC & PATIENT CLIENT API ROUTES
// ==========================================

// Public Appointment Booking (creates REAL booking in DB)
app.post('/api/appointments', (req: Request, res: Response) => {
  const { fullName, phone, email, appointmentType, preferredDate, preferredTime, message, doctor, attachments } = req.body;

  if (!fullName || !phone || !email || !preferredDate || !preferredTime) {
    res.status(400).json({ error: 'Please provide full name, phone number, email address, date, and preferred time.' });
    return;
  }

  // Format valid attachments if present
  const validAttachments = Array.isArray(attachments)
    ? attachments.slice(0, 5).map((att: any) => ({
        name: String(att.name || 'document'),
        size: Number(att.size || 0),
        type: String(att.type || 'application/octet-stream'),
        dataUrl: att.dataUrl ? String(att.dataUrl) : undefined,
      }))
    : [];

  const newAppointment = db.createAppointment({
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    email: String(email).trim().toLowerCase(),
    appointmentType: String(appointmentType || 'Sports & Orthopedic Physical Therapy').trim(),
    doctor: String(doctor || 'Dr. Iftikhar Ali').trim(),
    preferredDate: String(preferredDate).trim(),
    preferredTime: String(preferredTime).trim(),
    message: message ? String(message).trim() : '',
    attachments: validAttachments,
    status: 'Pending',
  });

  res.status(201).json({
    success: true,
    message: 'Your appointment request has been scheduled successfully! Confirmation and digital slip are ready.',
    appointment: newAppointment,
  });
});

// Bi-directional Appointment Sync (keeps PC and mobile appointments in sync at all times)
app.post('/api/appointments/sync', (req: Request, res: Response) => {
  const incoming = req.body?.appointments;
  if (!Array.isArray(incoming)) {
    res.json({ success: true, appointments: db.getAppointments() });
    return;
  }
  const result = db.syncAppointments(incoming);
  res.json({
    success: true,
    message: `Synced ${result.added} new and ${result.updated} updated appointments`,
    appointments: result.appointments,
    total: result.appointments.length,
  });
});

// Patient Appointment Quick Lookup (track status by ID or Phone)
app.get('/api/appointments/lookup', (req: Request, res: Response) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) {
    res.status(400).json({ error: 'Please provide your Appointment Reference ID or Phone number' });
    return;
  }

  const all = db.getAppointments();
  const matched = all.filter(a => 
    a.id.toLowerCase() === query || 
    a.phone.replace(/[^0-9]/g, '') === query.replace(/[^0-9]/g, '') ||
    a.phone.toLowerCase().includes(query) ||
    a.email.toLowerCase() === query
  );

  if (matched.length === 0) {
    res.status(404).json({ error: 'No appointment found matching this reference ID or phone number.' });
    return;
  }

  res.json({ success: true, appointments: matched });
});

// Patient Sign Up
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, phone, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Full name, email and password are required' });
    return;
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    res.status(400).json({ error: 'An account with this email address already exists. Please sign in.' });
    return;
  }

  // Hash password simple salt
  const passwordHash = crypto.createHash('sha256').update(String(password)).digest('hex');
  const user = db.createUser({
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone || '').trim(),
    passwordHash,
  });

  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, { email: user.email, userId: user.id, loggedAt: Date.now() });

  res.status(201).json({
    success: true,
    token,
    user,
  });
});

// Patient Sign In
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);

  if (!user) {
    res.status(401).json({ error: 'No patient account found with this email address.' });
    return;
  }

  const passwordHash = crypto.createHash('sha256').update(String(password)).digest('hex');
  // Allow simple match or hashed match
  if (user.passwordHash !== passwordHash && user.passwordHash !== String(password)) {
    res.status(401).json({ error: 'Incorrect password. Please check your credentials.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, { email: user.email, userId: user.id, loggedAt: Date.now() });

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// Patient Get Current Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    res.status(401).json({ authenticated: false });
    return;
  }

  const user = db.getUserByEmail(session.email);
  if (!user) {
    res.status(404).json({ authenticated: false, error: 'User not found' });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ authenticated: true, user: safeUser });
});

// Patient Get My Appointments
app.get('/api/user/appointments', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    res.status(401).json({ error: 'Sign in to view your appointments' });
    return;
  }

  const userAppointments = db.getAppointmentsByEmail(session.email);
  res.json({ appointments: userAppointments });
});

// Patient Cancel My Appointment
app.put('/api/user/appointments/:id/cancel', (req: Request, res: Response) => {
  const session = getAuthUser(req);
  if (!session) {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }

  const { id } = req.params;
  const apt = db.getAppointmentById(id);

  if (!apt || apt.email.toLowerCase() !== session.email.toLowerCase()) {
    res.status(404).json({ error: 'Appointment not found or not owned by you' });
    return;
  }

  const updated = db.updateAppointmentStatus(id, 'Cancelled');
  res.json({ success: true, appointment: updated });
});

// Patient Reviews & Feedback
app.get('/api/feedback', (req: Request, res: Response) => {
  const feedbackList = db.getFeedback();
  res.json({ feedback: feedbackList });
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const { patientName, rating, category, comment } = req.body;

  if (!patientName || !comment) {
    res.status(400).json({ error: 'Name and comment are required' });
    return;
  }

  const newFeedback = db.createFeedback({
    patientName: String(patientName).trim(),
    rating: Number(rating) || 5,
    category: String(category || 'ENT Consultation').trim(),
    comment: String(comment).trim(),
  });

  res.status(201).json({ success: true, feedback: newFeedback });
});

// Contact Form Inquiries
app.post('/api/contact', (req: Request, res: Response) => {
  const { fullName, email, phone, subject, message } = req.body;

  if (!fullName || !email || !message) {
    res.status(400).json({ error: 'Please provide full name, email, and message.' });
    return;
  }

  const inquiry = db.createInquiry({
    fullName: String(fullName).trim(),
    email: String(email).trim().toLowerCase(),
    phone: String(phone || '').trim(),
    subject: String(subject || 'General Inquiry').trim(),
    message: String(message).trim(),
  });

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting SPORC Clinic Rawalpindi! Our medical team will respond shortly.',
    inquiry,
  });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', clinic: 'SPORC Clinic Rawalpindi - Sports & Orthopedic Rehabilitation', timestamp: new Date().toISOString() });
});

// Guard: Guarantee all /api/* unmatched requests return JSON 404, NEVER HTML!
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});

// Centralized API error-handling middleware to guarantee JSON error output, NEVER HTML!
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error('API Error intercepted:', err);
    res.status(err?.status || 500).json({ error: err?.message || 'An unexpected server error occurred' });
    return;
  }
  next(err);
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SPORC Clinic Rawalpindi server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
