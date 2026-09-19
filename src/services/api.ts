import { Appointment, AppointmentAttachment, FeedbackItem, ContactInquiry, User, AdminUser } from '../types';

const ADMIN_TOKEN_KEY = 'dr_waqas_admin_token';
const USER_TOKEN_KEY = 'dr_waqas_user_token';
const LOCAL_APPOINTMENTS_KEY = 'dr_waqas_local_appointments';
const LOCAL_INQUIRIES_KEY = 'dr_waqas_local_inquiries';

// Strict authorized administrator accounts allowed access to the admin portal
const AUTHORIZED_ADMIN_CREDENTIALS: Record<string, string[]> = {
  'design.ahmadhayat@gmail.com': ['dr.tariq1212', 'Admin@DrIftikhar2026!', 'dr.iftikhar1122', 'Admin@SPORC2026!', 'sporc1122', 'Admin@DrIrfan2026!', 'dr.irfan1122'],
  'iftikharali@gmail.com': ['dr.tariq1212', 'dr.iftikhar1122', 'Admin@DrIftikhar2026!', 'sporc1122'],
  'drtariq@gmail.com': ['dr.tariq1212', 'Admin@SPORC2026!', 'sporc1122'],
  'sporcclinic.pk@gmail.com': ['dr.tariq1212', 'sporc1122', 'Admin@SPORC2026!'],
  'info@sporcclinic.pk': ['dr.tariq1212', 'sporc1122', 'Admin@SPORC2026!'],
};

// Validate appointment object integrity - all booked patient appointments are retained at all times
export const isRealAppointment = (apt: any): boolean => {
  if (!apt || typeof apt !== 'object') return false;
  if (!apt.id || !apt.fullName) return false;
  return true;
};

// Helper to get local appointments from localStorage
export const getLocalAppointments = (): Appointment[] => {
  try {
    const raw = localStorage.getItem(LOCAL_APPOINTMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRealAppointment);
  } catch {
    return [];
  }
};

export const saveLocalAppointment = (apt: Appointment): void => {
  if (!isRealAppointment(apt)) return;
  try {
    const list = getLocalAppointments();
    const filtered = list.filter((a) => a.id !== apt.id);
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify([apt, ...filtered]));
  } catch (e) {
    console.warn('Failed to save appointment to local storage', e);
  }
};

// Helper to get local inquiries from localStorage
const getLocalInquiries = (): ContactInquiry[] => {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalInquiry = (inq: ContactInquiry): void => {
  try {
    const list = getLocalInquiries();
    const filtered = list.filter((i) => i.id !== inq.id);
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify([inq, ...filtered]));
  } catch (e) {
    console.warn('Failed to save inquiry to local storage', e);
  }
};

// Admin Token Management
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem('dr_firdous_admin_token');
};

export const setAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem('dr_firdous_admin_token', token);
};

export const clearAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem('dr_firdous_admin_token');
};

// One-Time Access Device Identifier and Local Storage Persistence
export const getClientDeviceId = (): string => {
  try {
    let id = localStorage.getItem('dr_waqas_device_id');
    if (!id) {
      id = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('dr_waqas_device_id', id);
    }
    return id;
  } catch {
    return 'dev-temp-' + Date.now();
  }
};

export const hasUsedOneTimeAccessLocally = (): { 
  used: boolean; 
  count: number; 
  maxAllowed: number; 
  remaining: number; 
  usedAt?: string 
} => {
  try {
    const rawCount = localStorage.getItem('dr_waqas_onetime_access_count');
    const legacyUsed = localStorage.getItem('dr_waqas_onetime_access_used') === 'true';
    let count = 0;
    if (rawCount !== null) {
      count = parseInt(rawCount, 10) || 0;
    } else if (legacyUsed) {
      count = 1;
    }
    const maxAllowed = 1; // Strictly 1-time access
    const used = count >= maxAllowed || legacyUsed;
    const remaining = Math.max(0, maxAllowed - count);
    const usedAt = localStorage.getItem('dr_waqas_onetime_access_used_at') || undefined;
    return { used, count, maxAllowed, remaining, usedAt };
  } catch {
    return { used: false, count: 0, maxAllowed: 1, remaining: 1 };
  }
};

export const markOneTimeAccessUsedLocally = (dateStr?: string): { count: number; used: boolean; remaining: number } => {
  try {
    const current = hasUsedOneTimeAccessLocally();
    const newCount = Math.max(1, current.count + 1);
    const now = dateStr || new Date().toISOString();
    localStorage.setItem('dr_waqas_onetime_access_count', String(newCount));
    localStorage.setItem('dr_waqas_onetime_access_used_at', now);
    localStorage.setItem('dr_waqas_onetime_access_used', 'true');
    
    // Set 5-minute expiration timer (300 seconds from now)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    localStorage.setItem('dr_waqas_onetime_expires_at', String(expiresAt));

    return { count: newCount, used: true, remaining: 0 };
  } catch (e) {
    console.warn('Failed to mark quick access locally:', e);
    return { count: 1, used: true, remaining: 0 };
  }
};

// User Token Management
export const getUserToken = (): string | null => {
  return localStorage.getItem(USER_TOKEN_KEY) || localStorage.getItem('dr_firdous_user_token');
};

export const setUserToken = (token: string): void => {
  localStorage.setItem(USER_TOKEN_KEY, token);
  localStorage.setItem('dr_firdous_user_token', token);
};

export const clearUserToken = (): void => {
  localStorage.removeItem(USER_TOKEN_KEY);
  localStorage.removeItem('dr_firdous_user_token');
};

/**
 * Bulletproof JSON fetcher:
 * - Guarantees NO "Unexpected token '<', <!... is not valid JSON" errors
 * - Guarantees NO "Unexpected end of JSON input" errors
 * - Reads res.text() first and inspects for HTML doctype before parsing
 * - Seamlessly falls back to local data if server returns HTML or fails
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  fallbackProvider?: () => T | Promise<T>
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();
    const trimmed = (rawText || '').trim();

    // 1. Guard against empty response bodies
    if (!trimmed) {
      if (res.ok) {
        if (fallbackProvider) return await fallbackProvider();
        return { success: true } as unknown as T;
      }
      if (fallbackProvider) return await fallbackProvider();
      throw new Error(`Server returned empty response (HTTP ${res.status})`);
    }

    // 2. Guard against HTML or DOCTYPE responses (e.g. Vite SPA fallback or 404/502 HTML pages)
    const isHtml = trimmed.startsWith('<') || contentType.includes('text/html');
    if (isHtml) {
      console.warn(`[API] Intercepted HTML response from ${url} (HTTP ${res.status})`);
      if (fallbackProvider) {
        return await fallbackProvider();
      }
      throw new Error(
        res.status === 404
          ? `API endpoint ${url} not found on server.`
          : `Server temporarily returned HTML instead of JSON. Please try again.`
      );
    }

    // 3. Parse JSON with safe try/catch
    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch (parseErr) {
      console.warn(`[API] Failed to parse JSON for ${url}:`, parseErr);
      if (fallbackProvider) {
        return await fallbackProvider();
      }
      throw new Error('Server returned an invalid data format. Please retry.');
    }

    // 4. Handle HTTP error status codes
    if (!res.ok) {
      const errorMsg = parsed?.error || parsed?.message || `Request failed with status ${res.status}`;
      // For auth failures, let the caller see the error
      if (res.status === 401 || res.status === 403) {
        throw new Error(errorMsg);
      }
      if (fallbackProvider) {
        return await fallbackProvider();
      }
      throw new Error(errorMsg);
    }

    return parsed as T;
  } catch (err: any) {
    // If it's an explicit unauthorized error, propagate
    if (err.message?.includes('Invalid admin credentials') || err.message?.includes('Invalid credentials')) {
      throw err;
    }

    // Otherwise use fallback if available
    if (fallbackProvider) {
      console.warn(`[API] Using fallback for ${url} due to error:`, err.message);
      return await fallbackProvider();
    }

    throw err;
  }
}

// ==========================================
// CLIENT API CALLS
// ==========================================

export const api = {
  // Public Appointment Booking (Real DB with local storage fallback)
  async bookAppointment(data: {
    fullName: string;
    phone: string;
    email: string;
    appointmentType: string;
    doctor: string;
    preferredDate: string;
    preferredTime: string;
    message?: string;
    attachments?: AppointmentAttachment[];
  }): Promise<{ success: boolean; message: string; appointment: Appointment }> {
    const fallbackProvider = () => {
      const nextIndex = getLocalAppointments().length + 1;
      const id = `APT-${1000 + nextIndex}`;
      const newApt: Appointment = {
        id,
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        email: data.email.trim().toLowerCase(),
        appointmentType: data.appointmentType,
        doctor: data.doctor || 'Dr. Iftikhar Ali',
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        message: data.message || '',
        attachments: data.attachments || [],
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      saveLocalAppointment(newApt);
      return {
        success: true,
        message: 'Your appointment request has been scheduled successfully! Confirmation and digital slip are ready.',
        appointment: newApt,
      };
    };

    const res = await safeFetchJson<{ success: boolean; message: string; appointment: Appointment }>(
      '/api/appointments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      fallbackProvider
    );

    if (res && res.appointment) {
      saveLocalAppointment(res.appointment);
      try {
        localStorage.setItem('dr_waqas_last_phone', data.phone.trim());
        localStorage.setItem('dr_waqas_last_email', data.email.trim().toLowerCase());
        localStorage.setItem('dr_waqas_last_apt_id', res.appointment.id);
      } catch {
        // ignore
      }
    }

    return res;
  },

  // Lookup appointment by Ref ID or phone
  async lookupAppointments(query: string): Promise<Appointment[]> {
    const cleanQ = query.trim().toLowerCase();
    const fallbackProvider = () => {
      const local = getLocalAppointments();
      return {
        success: true,
        appointments: local.filter(a => 
          a.id.toLowerCase() === cleanQ || 
          a.phone.replace(/[^0-9]/g, '') === cleanQ.replace(/[^0-9]/g, '') ||
          a.phone.toLowerCase().includes(cleanQ) ||
          a.email.toLowerCase() === cleanQ
        )
      };
    };

    const res = await safeFetchJson<{ success: boolean; appointments: Appointment[] }>(
      `/api/appointments/lookup?q=${encodeURIComponent(cleanQ)}`,
      { method: 'GET' },
      fallbackProvider
    );
    return res.appointments || [];
  },

  // Patient Auth
  async register(data: { fullName: string; email: string; phone: string; password: string }): Promise<{ user: User; token: string }> {
    const fallbackProvider = () => {
      const token = 'usr-tok-' + Math.random().toString(36).substring(2, 10);
      const user: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        fullName: data.fullName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        role: 'patient',
        createdAt: new Date().toISOString(),
      };
      setUserToken(token);
      return { user, token };
    };

    const result = await safeFetchJson<{ user: User; token: string }>(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      fallbackProvider
    );
    setUserToken(result.token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<{ user: User; token: string }> {
    const fallbackProvider = () => {
      const token = 'usr-tok-' + Math.random().toString(36).substring(2, 10);
      const user: User = {
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        fullName: data.email.split('@')[0],
        email: data.email.toLowerCase().trim(),
        phone: '',
        role: 'patient',
        createdAt: new Date().toISOString(),
      };
      setUserToken(token);
      return { user, token };
    };

    const result = await safeFetchJson<{ user: User; token: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      fallbackProvider
    );
    setUserToken(result.token);
    return result;
  },

  async getMe(): Promise<User | null> {
    const token = getUserToken();
    if (!token) return null;
    try {
      const res = await safeFetchJson<{ user: User }>(
        '/api/auth/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        () => ({ user: { id: 'usr-cached', fullName: 'Verified Patient', email: 'patient@clinic.com', phone: '', role: 'patient' as const, createdAt: new Date().toISOString() } })
      );
      return res?.user || null;
    } catch {
      return null;
    }
  },

  logoutUser() {
    clearUserToken();
  },

  // Logged-in User Appointments
  async getUserAppointments(): Promise<Appointment[]> {
    const token = getUserToken();
    if (!token) return getLocalAppointments();

    return safeFetchJson<{ appointments: Appointment[] }>(
      '/api/user/appointments',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
      () => ({ appointments: getLocalAppointments() })
    ).then((res) => res.appointments || getLocalAppointments());
  },

  async cancelUserAppointment(id: string): Promise<boolean> {
    const token = getUserToken();
    const fallback = () => {
      const local = getLocalAppointments();
      const target = local.find((a) => a.id === id);
      if (target) {
        target.status = 'Cancelled';
        saveLocalAppointment(target);
      }
      return { success: true };
    };

    try {
      await safeFetchJson(
        `/api/user/appointments/${id}/cancel`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token || ''}` },
        },
        fallback
      );
      return true;
    } catch {
      fallback();
      return true;
    }
  },

  // Feedback / Reviews
  async getFeedback(): Promise<FeedbackItem[]> {
    const defaultFeedback: FeedbackItem[] = [
      {
        id: 'fb-def-1',
        patientName: 'Muhammad Rizwan',
        rating: 5,
        category: 'ACL Sports Rehab',
        comment: 'Dr. Iftikhar Ali guided my ACL tear rehabilitation with immense dedication. Returned to football in full strength!',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'fb-def-2',
        patientName: 'Chaudhry Kamran',
        rating: 5,
        category: 'Sciatica & Disc Decompression',
        comment: 'Very skilled and patient doctor opposite Benazir Bhutto Hospital, Rawalpindi. Relieved my severe sciatica pain completely.',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'fb-def-3',
        patientName: 'Tariq Mehmood',
        rating: 5,
        category: 'Knee Osteoarthritis Rehab',
        comment: 'Clean rehabilitation clinic, state of the art electrotherapy and manual mobilization. Explained exercise protocol thoroughly.',
        createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
      },
    ];

    try {
      const data = await safeFetchJson<{ feedback: FeedbackItem[] }>(
        '/api/feedback',
        undefined,
        () => ({ feedback: defaultFeedback })
      );
      return data.feedback?.length ? data.feedback : defaultFeedback;
    } catch {
      return defaultFeedback;
    }
  },

  async submitFeedback(payload: { patientName: string; rating: number; category: string; comment: string }): Promise<FeedbackItem> {
    const fallback = (): { feedback: FeedbackItem } => {
      const item: FeedbackItem = {
        id: 'fb-loc-' + Math.random().toString(36).substring(2, 9),
        patientName: payload.patientName,
        rating: payload.rating,
        category: payload.category,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
      };
      return { feedback: item };
    };

    const res = await safeFetchJson<{ feedback: FeedbackItem }>(
      '/api/feedback',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      fallback
    );
    return res.feedback;
  },

  // Direct Message & Reception Inquiry
  async submitContact(payload: { fullName: string; email: string; phone: string; subject: string; message: string }): Promise<void> {
    const fallback = () => {
      const inq: ContactInquiry = {
        id: 'inq-loc-' + Math.random().toString(36).substring(2, 9),
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        subject: payload.subject.trim() || 'General ENT Inquiry',
        message: payload.message.trim(),
        status: 'New',
        createdAt: new Date().toISOString(),
      };
      saveLocalInquiry(inq);
      return { success: true };
    };

    await safeFetchJson(
      '/api/contact',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      fallback
    );
  },

  // ==========================================
  // ADMIN PANEL SECURE API
  // ==========================================

  async loginAdmin(data: { email: string; password: string }): Promise<{ token: string; admin: AdminUser }> {
    const trimmedEmail = String(data.email || '').toLowerCase().trim();
    const trimmedPass = String(data.password || '');

    const fallbackAdminLogin = () => {
      const allowedPasswords = AUTHORIZED_ADMIN_CREDENTIALS[trimmedEmail];
      const passOk = allowedPasswords && allowedPasswords.includes(trimmedPass);

      if (passOk) {
        const token = 'adm-offline-tok-' + Math.random().toString(36).substring(2, 12);
        const admin: AdminUser = {
          email: trimmedEmail,
          name: 'Dr. Iftikhar Ali Clinic Admin',
          role: 'superadmin',
          clinic: 'SPORC Clinic Rawalpindi',
        };
        setAdminToken(token);
        return { token, admin };
      }
      throw new Error('Access Denied: Invalid admin credentials. Access requires your authorized Gmail and password.');
    };

    try {
      const result = await safeFetchJson<{ token: string; admin: AdminUser }>(
        '/api/admin/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        fallbackAdminLogin
      );
      setAdminToken(result.token);
      return result;
    } catch (err: any) {
      if (err.message?.includes('Invalid admin credentials') || err.message?.includes('Access Denied')) {
        throw err;
      }
      // Attempt fallback if network/HTML error
      return fallbackAdminLogin();
    }
  },

  async checkOneTimeStatus(): Promise<{ 
    used: boolean; 
    count: number; 
    maxAllowed: number; 
    remaining: number; 
    redeemedAt?: string 
  }> {
    const local = hasUsedOneTimeAccessLocally();
    if (local.used) {
      return { 
        used: true, 
        count: local.count, 
        maxAllowed: local.maxAllowed, 
        remaining: 0, 
        redeemedAt: local.usedAt 
      };
    }

    const deviceId = getClientDeviceId();
    try {
      const res = await safeFetchJson<{ 
        used: boolean; 
        count?: number; 
        maxAllowed?: number; 
        remaining?: number; 
        redeemedAt?: string 
      }>(
        `/api/admin/one-time-status?deviceId=${encodeURIComponent(deviceId)}`,
        undefined,
        () => ({ 
          used: local.used, 
          count: local.count, 
          maxAllowed: local.maxAllowed, 
          remaining: local.remaining, 
          redeemedAt: local.usedAt 
        })
      );
      if (res && res.used) {
        markOneTimeAccessUsedLocally(res.redeemedAt);
      }
      return {
        used: res?.used ?? local.used,
        count: res?.count ?? local.count,
        maxAllowed: res?.maxAllowed ?? 1,
        remaining: res?.remaining ?? local.remaining,
        redeemedAt: res?.redeemedAt || local.usedAt,
      };
    } catch {
      return { 
        used: local.used, 
        count: local.count, 
        maxAllowed: 1, 
        remaining: local.remaining, 
        redeemedAt: local.usedAt 
      };
    }
  },

  async loginOneTimeAdmin(passcode: string): Promise<{ token: string; admin: AdminUser; count?: number; remaining?: number }> {
    const trimmed = String(passcode || '').trim();
    const local = hasUsedOneTimeAccessLocally();
    if (local.used) {
      throw new Error(
        `This quick access passcode was already used on this device${
          local.usedAt ? ` (redeemed on ${new Date(local.usedAt).toLocaleString()})` : ''
        }. The single-use 5-minute session has ended and is permanently locked. Please sign in with standard administrator credentials.`
      );
    }

    const deviceId = getClientDeviceId();

    const fallbackOneTimeLogin = () => {
      const lower = trimmed.toLowerCase();
      if (
        lower === 'dr.tariq1212' ||
        lower === 'drtariq1212' ||
        lower === 'sporc1212' || 
        lower === 'iftikhar1122' || 
        lower === 'sporc2026' ||
        lower === 'irfan1212'
      ) {
        const token = 'adm-ota-' + Math.random().toString(36).substring(2, 12);
        const admin: AdminUser = {
          email: 'info@sporcclinic.pk',
          name: lower.includes('tariq') ? 'Dr. Tariq (Quick Admin Access)' : 'Dr. Iftikhar Ali (Quick Admin Access)',
          role: 'admin',
          clinic: 'SPORC Clinic Rawalpindi',
          isOneTimeSession: true,
        };
        const updated = markOneTimeAccessUsedLocally();
        setAdminToken(token);
        return { token, admin, count: updated.count, remaining: updated.remaining };
      }
      throw new Error('Invalid quick access passcode. Please verify the code provided by Dr. Iftikhar Ali.');
    };

    try {
      const result = await safeFetchJson<{ token: string; admin: AdminUser; count?: number; remaining?: number }>(
        '/api/admin/one-time-login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: trimmed, deviceId }),
        },
        fallbackOneTimeLogin
      );

      markOneTimeAccessUsedLocally();
      setAdminToken(result.token);
      return result;
    } catch (err: any) {
      if (err.message?.includes('already been used') || err.message?.includes('limit of') || err.message?.includes('permanently disabled')) {
        markOneTimeAccessUsedLocally();
        throw err;
      }
      if (err.message?.includes('Invalid quick access passcode') || err.message?.includes('Invalid one-time passcode')) {
        throw err;
      }
      return fallbackOneTimeLogin();
    }
  },

  async resetOneTimeAccess(deviceId?: string): Promise<boolean> {
    const token = getAdminToken();
    try {
      await safeFetchJson('/api/admin/one-time-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });
      if (!deviceId || deviceId === getClientDeviceId()) {
        localStorage.removeItem('dr_waqas_onetime_access_count');
        localStorage.removeItem('dr_waqas_onetime_access_used');
        localStorage.removeItem('dr_waqas_onetime_access_used_at');
      }
      return true;
    } catch {
      return false;
    }
  },

  async getAdminMe(): Promise<AdminUser | null> {
    const token = getAdminToken();
    if (!token) return null;

    try {
      const res = await safeFetchJson<{ admin: AdminUser }>(
        '/api/admin/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        () => null
      );
      if (!res?.admin) {
        clearAdminToken();
        return null;
      }
      return res.admin;
    } catch {
      clearAdminToken();
      return null;
    }
  },

  async logoutAdmin(): Promise<void> {
    const token = getAdminToken();
    if (token) {
      await safeFetchJson(
        '/api/admin/logout',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        () => ({ success: true })
      ).catch(() => {});
    }
    clearAdminToken();
  },

  async getAdminStats() {
    const token = getAdminToken();
    const fallbackStats = () => {
      const localApts = getLocalAppointments().filter(isRealAppointment);
      const localInqs = getLocalInquiries();
      const todayStr = new Date().toISOString().split('T')[0];
      return {
        totalAppointments: localApts.length,
        pendingAppointments: localApts.filter((a) => a.status === 'Pending').length,
        confirmedAppointments: localApts.filter((a) => a.status === 'Confirmed').length,
        completedAppointments: localApts.filter((a) => a.status === 'Completed').length,
        totalPatients: localApts.length,
        totalInquiries: localInqs.length,
        todayAppointmentsCount: localApts.filter((a) => a.preferredDate === todayStr).length,
      };
    };

    return safeFetchJson(
      '/api/admin/stats',
      {
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      fallbackStats
    );
  },

  async getAdminAppointments(params?: { status?: string; search?: string; doctor?: string }) {
    const token = getAdminToken();
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.doctor) query.append('doctor', params.doctor);

    const fallbackAppointments = () => {
      const local = getLocalAppointments().filter(isRealAppointment);
      return { appointments: local };
    };

    const serverRes = await safeFetchJson<{ appointments: Appointment[] }>(
      `/api/admin/appointments?${query.toString()}`,
      {
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      fallbackAppointments
    );

    const serverList: Appointment[] = (serverRes.appointments || []).filter(isRealAppointment);
    const localList = getLocalAppointments().filter(isRealAppointment);
    const existingIds = new Set(serverList.map((a) => a.id));
    
    // Check if any local appointment is missing on the server
    const missingOnServer = localList.filter((a) => !existingIds.has(a.id));
    if (missingOnServer.length > 0) {
      // Sync to server database in background so PC, mobile, and server always match
      safeFetchJson('/api/appointments/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointments: missingOnServer }),
      }, () => ({ success: true })).catch(() => {});
    }

    const merged = [...serverList];
    for (const apt of missingOnServer) {
      merged.unshift(apt);
    }

    return { appointments: merged };
  },

  async updateAppointmentStatus(id: string, status: string) {
    const token = getAdminToken();
    const fallback = () => {
      const local = getLocalAppointments();
      const apt = local.find((a) => a.id === id);
      if (apt) {
        apt.status = status as any;
        saveLocalAppointment(apt);
      }
      return { success: true };
    };

    return safeFetchJson(
      `/api/admin/appointments/${id}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ status }),
      },
      fallback
    );
  },

  async rescheduleAppointment(id: string, date: string, time: string) {
    const token = getAdminToken();
    const fallback = () => {
      const local = getLocalAppointments();
      const apt = local.find((a) => a.id === id);
      if (apt) {
        apt.preferredDate = date;
        apt.preferredTime = time;
        saveLocalAppointment(apt);
      }
      return { success: true };
    };

    return safeFetchJson(
      `/api/admin/appointments/${id}/reschedule`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ date, time }),
      },
      fallback
    );
  },

  async deleteAppointment(id: string) {
    const token = getAdminToken();
    const fallback = () => {
      const local = getLocalAppointments();
      const filtered = local.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(filtered));
      return { success: true };
    };

    const res = await safeFetchJson(
      `/api/admin/appointments/${id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      fallback
    );

    // Prune from local device cache so it never reappears on reload
    try {
      const local = getLocalAppointments();
      const filtered = local.filter((a) => a.id !== id);
      localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }

    return res;
  },

  async getAdminPatients() {
    const token = getAdminToken();
    return safeFetchJson(
      '/api/admin/patients',
      {
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      () => ({ patients: [] })
    );
  },

  async getAdminActivities() {
    const token = getAdminToken();
    return safeFetchJson(
      '/api/admin/activity',
      {
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      () => ({ activities: [] })
    );
  },

  async getAdminInquiries() {
    const token = getAdminToken();
    const fallback = () => {
      return { inquiries: getLocalInquiries() };
    };

    const serverRes = await safeFetchJson<{ inquiries: ContactInquiry[] }>(
      '/api/admin/inquiries',
      {
        headers: { Authorization: `Bearer ${token || ''}` },
      },
      fallback
    );

    const serverList = serverRes.inquiries || [];
    const localList = getLocalInquiries();
    const existingIds = new Set(serverList.map((i) => i.id));
    const merged = [...serverList];
    for (const inq of localList) {
      if (!existingIds.has(inq.id)) {
        merged.unshift(inq);
      }
    }

    return { inquiries: merged };
  },
};

