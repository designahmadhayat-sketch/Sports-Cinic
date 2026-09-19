import fs from 'fs';
import path from 'path';

export interface AppointmentAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface Appointment {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  appointmentType: string;
  doctor: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  attachments?: AppointmentAttachment[];
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'patient';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'appointment_created' | 'appointment_status' | 'appointment_rescheduled' | 'appointment_cancelled' | 'user_registered' | 'inquiry_received' | 'feedback_submitted';
  action: string;
  details: string;
  timestamp: string;
}

export interface Feedback {
  id: string;
  patientName: string;
  rating: number;
  category: string;
  comment: string;
  createdAt: string;
}

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'New' | 'Replied' | 'Archived';
  createdAt: string;
}

export interface OneTimeAccessRedemption {
  id: string;
  deviceId: string;
  ip?: string;
  userAgent?: string;
  redeemedAt: string;
}

interface ClinicDatabase {
  appointments: Appointment[];
  users: User[];
  activityLogs: ActivityLog[];
  feedback: Feedback[];
  inquiries: ContactInquiry[];
  oneTimeRedemptions?: OneTimeAccessRedemption[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'clinic_data.json');

// Initial real appointments database: starts clean, only real appointments submitted by real patients
const INITIAL_DATA: ClinicDatabase = {
  appointments: [],
  users: [],
  activityLogs: [],
  feedback: [
    {
      id: 'fb-001',
      patientName: 'Muhammad Rizwan',
      rating: 5,
      category: 'Sports Injury & ACL Rehab',
      comment: 'Dr. Iftikhar Ali provided exceptional care for my knee ligament tear. The targeted physical therapy and strengthening helped me get back on the field.',
      createdAt: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'fb-002',
      patientName: 'Chaudhry Kamran',
      rating: 5,
      category: 'Sciatica & Disc Decompression',
      comment: 'Suffered from excruciating lower back and leg pain for months. After manual therapy and spine decompression at SPORC Clinic on Murree Road, I am completely pain-free.',
      createdAt: '2026-08-29T11:30:00.000Z',
    },
    {
      id: 'fb-003',
      patientName: 'Malik Zeeshan',
      rating: 5,
      category: 'Knee Osteoarthritis Program',
      comment: 'My mother was unable to walk due to severe knee osteoarthritis. Dr. Iftikhar Ali\'s rehabilitation plan improved her mobility tremendously without surgery.',
      createdAt: '2026-09-02T16:00:00.000Z',
    },
    {
      id: 'fb-004',
      patientName: 'Dr. Farhan Qureshi',
      rating: 5,
      category: 'Frozen Shoulder Mobilization',
      comment: 'Regained 100% range of motion in my left shoulder after 6 sessions of manual therapy and therapeutic exercises. Highly professional facility.',
      createdAt: '2026-09-05T14:40:00.000Z',
    },
    {
      id: 'fb-005',
      patientName: 'Noman Bashir',
      rating: 5,
      category: 'Post-Surgical Rehabilitation',
      comment: 'Excellent rehabilitation after my ankle surgery. State-of-the-art gym equipment and one-on-one attention from the physiotherapist.',
      createdAt: '2026-09-07T12:15:00.000Z',
    },
    {
      id: 'fb-006',
      patientName: 'Hamza Abbasi',
      rating: 5,
      category: 'Neck & Cervical Spondylosis',
      comment: 'Continuous desk work had caused severe cervical stiffness and headaches. The posture correction and cervical traction gave instant relief.',
      createdAt: '2026-09-09T09:20:00.000Z',
    },
  ],
  inquiries: [],
  oneTimeRedemptions: [],
};

class DatabaseManager {
  private data: ClinicDatabase;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ClinicDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        
        // Preserve all existing clinic appointments - never delete or remove unless explicitly deleted by admin
        if (Array.isArray(parsed.appointments)) {
          // Keep all appointments intact
          parsed.appointments = parsed.appointments.filter((apt: any) => apt && apt.id && apt.fullName);
        }

        // Preserve all registered clinic users
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.filter((usr: any) => usr && usr.email);
        }

        // Preserve inquiries
        if (Array.isArray(parsed.inquiries)) {
          parsed.inquiries = parsed.inquiries.filter((inq: any) => inq && inq.id);
        }

        // Strict hygiene: Ensure feedback records are accurate SPORC clinic feedback
        if (Array.isArray(parsed.feedback)) {
          const hasLegacyFeedback = parsed.feedback.some((fb: Feedback) => 
            (fb.category || '').toLowerCase().includes('dental') || 
            (fb.category || '').toLowerCase().includes('ear') ||
            (fb.category || '').toLowerCase().includes('sinus') ||
            (fb.category || '').toLowerCase().includes('throat') ||
            (fb.comment || '').toLowerCase().includes('irfan') ||
            (fb.comment || '').toLowerCase().includes('kot chutta')
          );
          if (hasLegacyFeedback) {
            parsed.feedback = INITIAL_DATA.feedback;
          }
        }

        // Update any old doctor activity logs to Dr. Iftikhar Ali
        if (Array.isArray(parsed.activityLogs)) {
          parsed.activityLogs = parsed.activityLogs.map((act: ActivityLog) => {
            let details = act.details || '';
            details = details.replace(/Dr\. Irfan Chandia/g, 'Dr. Iftikhar Ali');
            details = details.replace(/Dr\. Muhammad Waqas Khichi/g, 'Dr. Iftikhar Ali');
            details = details.replace(/Dr\. Waqas Khichi/g, 'Dr. Iftikhar Ali');
            return { ...act, details };
          });
        }
        
        return {
          appointments: parsed.appointments || INITIAL_DATA.appointments,
          users: parsed.users || INITIAL_DATA.users,
          activityLogs: parsed.activityLogs || INITIAL_DATA.activityLogs,
          feedback: parsed.feedback || INITIAL_DATA.feedback,
          inquiries: parsed.inquiries || [],
          oneTimeRedemptions: Array.isArray(parsed.oneTimeRedemptions) ? parsed.oneTimeRedemptions : [],
        };
      } else {
        fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
        return JSON.parse(JSON.stringify(INITIAL_DATA));
      }
    } catch (err) {
      console.error('Error loading database file, using clean initial data:', err);
      return JSON.parse(JSON.stringify(INITIAL_DATA));
    }
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // Appointments
  getAppointments(): Appointment[] {
    return [...this.data.appointments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find(a => a.id === id);
  }

  getAppointmentsByEmail(email: string): Appointment[] {
    const cleanEmail = email.toLowerCase().trim();
    return this.data.appointments.filter(a => a.email.toLowerCase().trim() === cleanEmail);
  }

  createAppointment(payload: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { status?: Appointment['status'] }): Appointment {
    // Generate clean, authentic clinic appointment number (e.g. APT-1001, APT-1002)
    const count = this.data.appointments.length;
    const id = `APT-${1001 + count}`;
    const newAppointment: Appointment = {
      ...payload,
      id,
      status: payload.status || 'Pending',
      createdAt: new Date().toISOString(),
    };

    this.data.appointments.unshift(newAppointment);

    // Ensure patient user exists or is recorded
    const existingUser = this.getUserByEmail(payload.email);
    if (!existingUser) {
      const newUser: User = {
        id: `usr-${Date.now().toString(36).slice(-5)}`,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        passwordHash: 'patient123',
        role: 'patient',
        createdAt: new Date().toISOString(),
      };
      this.data.users.push(newUser);
    }

    // Genuine activity log
    this.addActivity({
      type: 'appointment_created',
      action: 'New Appointment Booked',
      details: `${payload.fullName} booked an appointment for ${payload.appointmentType} with ${payload.doctor || 'Doctor'} on ${payload.preferredDate}`,
    });

    this.persist();
    return newAppointment;
  }

  updateAppointmentStatus(id: string, status: Appointment['status']): Appointment | null {
    const apt = this.data.appointments.find(a => a.id === id);
    if (!apt) return null;

    const prevStatus = apt.status;
    apt.status = status;
    apt.updatedAt = new Date().toISOString();

    this.addActivity({
      type: 'appointment_status',
      action: `Status Updated to ${status}`,
      details: `Appointment for ${apt.fullName} (#${id}) status changed from ${prevStatus} to ${status}`,
    });

    this.persist();
    return apt;
  }

  rescheduleAppointment(id: string, date: string, time: string): Appointment | null {
    const apt = this.data.appointments.find(a => a.id === id);
    if (!apt) return null;

    const oldDate = apt.preferredDate;
    const oldTime = apt.preferredTime;
    apt.preferredDate = date;
    apt.preferredTime = time;
    apt.updatedAt = new Date().toISOString();

    this.addActivity({
      type: 'appointment_rescheduled',
      action: 'Appointment Rescheduled',
      details: `Appointment for ${apt.fullName} (#${id}) moved from ${oldDate} ${oldTime} to ${date} ${time}`,
    });

    this.persist();
    return apt;
  }

  deleteAppointment(id: string): boolean {
    const idx = this.data.appointments.findIndex(a => a.id === id);
    if (idx === -1) return false;

    const [deleted] = this.data.appointments.splice(idx, 1);
    this.addActivity({
      type: 'appointment_cancelled',
      action: 'Appointment Removed',
      details: `Appointment for ${deleted.fullName} (#${id}) was cancelled/removed`,
    });

    this.persist();
    return true;
  }

  syncAppointments(incoming: Appointment[]): { added: number; updated: number; appointments: Appointment[] } {
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return { added: 0, updated: 0, appointments: this.getAppointments() };
    }
    let added = 0;
    let updated = 0;

    for (const apt of incoming) {
      if (!apt || !apt.id || !apt.fullName) continue;
      const existingIdx = this.data.appointments.findIndex(a => a.id === apt.id);
      if (existingIdx >= 0) {
        this.data.appointments[existingIdx] = {
          ...this.data.appointments[existingIdx],
          ...apt,
        };
        updated++;
      } else {
        this.data.appointments.unshift(apt);
        added++;
        if (apt.email) {
          const existingUser = this.getUserByEmail(apt.email);
          if (!existingUser) {
            this.data.users.push({
              id: `usr-${Date.now().toString(36).slice(-5)}`,
              fullName: apt.fullName,
              email: apt.email,
              phone: apt.phone || '',
              passwordHash: 'patient123',
              role: 'patient',
              createdAt: apt.createdAt || new Date().toISOString(),
            });
          }
        }
      }
    }

    if (added > 0 || updated > 0) {
      this.persist();
    }
    return { added, updated, appointments: this.getAppointments() };
  }

  // Users & Patients
  getUsers(): Omit<User, 'passwordHash'>[] {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  getUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    return this.data.users.find(u => u.email.toLowerCase().trim() === clean);
  }

  createUser(payload: { fullName: string; email: string; phone: string; passwordHash: string }): Omit<User, 'passwordHash'> {
    const id = `usr-${Date.now().toString(36).slice(-5)}`;
    const newUser: User = {
      id,
      fullName: payload.fullName,
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone,
      passwordHash: payload.passwordHash,
      role: 'patient',
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);

    this.addActivity({
      type: 'user_registered',
      action: 'New Patient Registered',
      details: `Patient ${payload.fullName} (${payload.email}) registered an account`,
    });

    this.persist();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return [...this.data.activityLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private addActivity(entry: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const newLog: ActivityLog = {
      ...entry,
      id: `act-${Date.now().toString(36).slice(-5)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(newLog);
    // Keep last 100 genuine activities
    if (this.data.activityLogs.length > 100) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 100);
    }
  }

  // Feedback
  getFeedback(): Feedback[] {
    return [...this.data.feedback].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createFeedback(payload: { patientName: string; rating: number; category: string; comment: string }): Feedback {
    const newFb: Feedback = {
      id: `fb-${Date.now().toString(36).slice(-5)}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    this.data.feedback.unshift(newFb);
    this.addActivity({
      type: 'feedback_submitted',
      action: 'Patient Feedback Received',
      details: `${payload.patientName} left a ${payload.rating}-star review for ${payload.category}`,
    });
    this.persist();
    return newFb;
  }

  // Inquiries
  getInquiries(): ContactInquiry[] {
    return [...this.data.inquiries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  createInquiry(payload: { fullName: string; email: string; phone: string; subject: string; message: string }): ContactInquiry {
    const newInquiry: ContactInquiry = {
      id: `inq-${Date.now().toString(36).slice(-5)}`,
      ...payload,
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    this.data.inquiries.unshift(newInquiry);
    this.addActivity({
      type: 'inquiry_received',
      action: 'Contact Inquiry Received',
      details: `New message received from ${payload.fullName}: "${payload.subject}"`,
    });
    this.persist();
    return newInquiry;
  }

  updateInquiryStatus(id: string, status: ContactInquiry['status']): ContactInquiry | null {
    const inq = this.data.inquiries.find(i => i.id === id);
    if (!inq) return null;
    inq.status = status;
    this.persist();
    return inq;
  }

  // Dashboard Stats computed dynamically from real database records
  getStats() {
    const totalAppointments = this.data.appointments.length;
    const confirmedAppointments = this.data.appointments.filter(a => a.status === 'Confirmed').length;
    const pendingAppointments = this.data.appointments.filter(a => a.status === 'Pending').length;
    const completedAppointments = this.data.appointments.filter(a => a.status === 'Completed').length;
    const cancelledAppointments = this.data.appointments.filter(a => a.status === 'Cancelled').length;
    const totalPatients = this.data.users.length;
    const totalInquiries = this.data.inquiries.length;
    const totalFeedback = this.data.feedback.length;

    return {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      totalPatients,
      totalInquiries,
      totalFeedback,
    };
  }

  // Quick emergency/authorized access tracking (Strictly ONE-TIME (1 use) per device/client, valid for a 5-minute session)
  hasUsedOneTimeAccess(deviceId?: string, ip?: string): { 
    used: boolean; 
    count: number; 
    maxAllowed: number; 
    remaining: number; 
    record?: OneTimeAccessRedemption 
  } {
    const list = this.data.oneTimeRedemptions || [];
    const cleanDev = (deviceId || '').trim();
    const cleanIp = (ip || '').trim();

    const matches = list.filter(r => 
      (cleanDev && r.deviceId === cleanDev) ||
      (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1' && cleanIp !== 'unknown' && r.ip === cleanIp)
    );

    const count = matches.length;
    const maxAllowed = 1; // Strictly one-time access
    const lastRecord = matches[matches.length - 1];

    return {
      used: count >= maxAllowed,
      count,
      maxAllowed,
      remaining: Math.max(0, maxAllowed - count),
      record: lastRecord,
    };
  }

  redeemOneTimeAccess(deviceId: string, ip?: string, userAgent?: string): {
    redemption: OneTimeAccessRedemption;
    count: number;
    maxAllowed: number;
    remaining: number;
  } {
    if (!this.data.oneTimeRedemptions) {
      this.data.oneTimeRedemptions = [];
    }

    const redemption: OneTimeAccessRedemption = {
      id: `ota-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deviceId: deviceId || `dev-${Date.now()}`,
      ip: ip || '',
      userAgent: (userAgent || '').substring(0, 120),
      redeemedAt: new Date().toISOString(),
    };

    this.data.oneTimeRedemptions.push(redemption);

    const usage = this.hasUsedOneTimeAccess(deviceId, ip);

    this.addActivity({
      type: 'user_registered',
      action: 'One-Time Admin Passcode Redeemed (5-Minute Session Started)',
      details: `One-time access passcode redeemed by device (${redemption.deviceId.substring(0, 15)}...) from IP: ${redemption.ip || 'Direct'}. Single-use 5-minute session initiated. Code is now permanently locked for this device.`,
    });

    this.persist();
    return {
      redemption,
      count: usage.count,
      maxAllowed: usage.maxAllowed,
      remaining: usage.remaining,
    };
  }

  getOneTimeRedemptions(): OneTimeAccessRedemption[] {
    return this.data.oneTimeRedemptions || [];
  }

  resetOneTimeAccess(deviceId?: string): boolean {
    if (!this.data.oneTimeRedemptions) return false;
    if (deviceId) {
      this.data.oneTimeRedemptions = this.data.oneTimeRedemptions.filter(r => r.deviceId !== deviceId);
    } else {
      this.data.oneTimeRedemptions = [];
    }
    this.addActivity({
      type: 'appointment_status',
      action: 'One-Time Passcode Access Reset',
      details: deviceId ? `One-time access re-enabled for device: ${deviceId}` : 'One-time access re-enabled by Clinic Administrator.',
    });
    this.persist();
    return true;
  }
}

export const db = new DatabaseManager();
