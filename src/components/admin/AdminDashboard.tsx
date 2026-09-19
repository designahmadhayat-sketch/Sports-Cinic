import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  LogOut, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Edit3, 
  Trash2, 
  Activity, 
  Mail, 
  ArrowLeft,
  Phone, 
  FileText, 
  Download, 
  Paperclip,
  Plus,
  Printer,
  ExternalLink,
  FileSpreadsheet,
  Menu,
  X,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  KeyRound
} from 'lucide-react';
import { api } from '../../services/api';
import { clinicImages } from '../../assets';
import { Appointment, AdminUser, ActivityLog, ContactInquiry, AppointmentStatus } from '../../types';
import { AppointmentSlipModal } from '../AppointmentSlipModal';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
  onReturnToSite: () => void;
}

import { CLINIC_INFO } from '../../data/clinicData';

type TabType = 'overview' | 'appointments' | 'calendar' | 'patients' | 'inquiries' | 'activity';

const REHAB_TREATMENTS = [
  'Sports Injury & Athlete Rehabilitation',
  'Manual Physical Therapy & Mobilization',
  'Spine, Slip Disc & Sciatica Decompression',
  'Knee Ligament (ACL/PCL/Meniscus) Rehab',
  'Shoulder & Rotator Cuff Care',
  'Neck, Cervical & Posture Correction',
  'Post-Surgical Orthopedic Recovery',
  'Joint Pain & Osteoarthritis Program',
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  onLogout,
  onReturnToSite,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Real database state
  const [stats, setStats] = useState<{
    totalAppointments: number;
    confirmedAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalPatients: number;
    totalInquiries: number;
  } | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);

  // Filtering & search states for appointments
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [quickDateFilter, setQuickDateFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  // Loading & error feedback
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals inside admin
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [deleteConfirmAppointment, setDeleteConfirmAppointment] = useState<Appointment | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<Appointment | null>(null);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Reschedule Form state
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Walk-in / New Booking Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [newBookingData, setNewBookingData] = useState({
    fullName: '',
    phone: '',
    email: '',
    appointmentType: REHAB_TREATMENTS[0],
    doctor: 'Dr. Iftikhar Ali',
    preferredDate: todayStr,
    preferredTime: '11:00 AM',
    status: 'Confirmed' as AppointmentStatus,
    message: '',
  });

  // 5-minute session countdown for One-Time Quick Access Passcode
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(() => {
    if (!admin.isOneTimeSession) return 0;
    try {
      const expiresAtStr = localStorage.getItem('dr_waqas_onetime_expires_at');
      let expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
      if (!expiresAt || isNaN(expiresAt)) {
        expiresAt = Date.now() + 5 * 60 * 1000;
        localStorage.setItem('dr_waqas_onetime_expires_at', String(expiresAt));
      }
      return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    } catch {
      return 300;
    }
  });

  useEffect(() => {
    if (!admin.isOneTimeSession) return;

    let expiresAtStr = localStorage.getItem('dr_waqas_onetime_expires_at');
    let expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
    if (!expiresAt || isNaN(expiresAt)) {
      expiresAt = Date.now() + 5 * 60 * 1000;
      localStorage.setItem('dr_waqas_onetime_expires_at', String(expiresAt));
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSessionTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Clear token and permanently lock one-time access on this device
        try {
          localStorage.removeItem('dr_waqas_admin_token');
          localStorage.setItem('dr_waqas_onetime_access_used', 'true');
        } catch {}
        alert('Your one-time 5-minute temporary admin session has expired. You have been automatically logged out.');
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [admin.isOneTimeSession, onLogout]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(sessionTimeLeft / 60);
    const secs = sessionTimeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [sessionTimeLeft]);

  // Fetch all real database records
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, aptsRes, ptsRes, actRes, inqRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminAppointments({ status: statusFilter, search: searchTerm, doctor: doctorFilter }),
        api.getAdminPatients(),
        api.getAdminActivities(),
        api.getAdminInquiries(),
      ]);

      setStats(statsRes);
      setAppointments(aptsRes.appointments || []);
      setPatients(ptsRes.patients || []);
      setActivities(actRes.activities || []);
      setInquiries(inqRes.inquiries || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to sync with real database' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // Background polling every 12s ensures PC and mobile always show the same real appointments in real time
    const interval = setInterval(() => {
      api.getAdminAppointments({ status: statusFilter, search: searchTerm, doctor: doctorFilter })
        .then((res) => {
          if (res.appointments && Array.isArray(res.appointments)) {
            setAppointments(res.appointments);
          }
        })
        .catch(() => {});
    }, 12000);

    return () => clearInterval(interval);
  }, [statusFilter, doctorFilter, searchTerm]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDashboardData();
  };

  // Status update
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setActionLoading(true);
      await api.updateAppointmentStatus(id, newStatus);
      setFeedbackMsg({ type: 'success', text: `Appointment #${id} updated to ${newStatus}` });
      if (viewingAppointment && viewingAppointment.id === id) {
        setViewingAppointment(prev => prev ? { ...prev, status: newStatus as AppointmentStatus } : null);
      }
      await loadDashboardData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppointment || !newDate || !newTime) return;

    try {
      setActionLoading(true);
      await api.rescheduleAppointment(reschedulingAppointment.id, newDate, newTime);
      setFeedbackMsg({
        type: 'success',
        text: `Appointment #${reschedulingAppointment.id} rescheduled to ${newDate} at ${newTime}`,
      });
      setReschedulingAppointment(null);
      await loadDashboardData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to reschedule' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await api.deleteAppointment(id);
      setDeleteConfirmAppointment(null);
      setFeedbackMsg({ type: 'success', text: `Appointment #${id} deleted from database` });
      await loadDashboardData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete appointment' });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Walk-in / Direct Admin Booking
  const handleCreateNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingData.fullName.trim() || !newBookingData.phone.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Patient Name and Phone are required.' });
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.bookAppointment({
        fullName: newBookingData.fullName.trim(),
        phone: newBookingData.phone.trim(),
        email: newBookingData.email.trim() || `${newBookingData.phone.replace(/\D/g, '')}@clinic-patient.local`,
        appointmentType: newBookingData.appointmentType,
        doctor: newBookingData.doctor,
        preferredDate: newBookingData.preferredDate,
        preferredTime: newBookingData.preferredTime,
        message: newBookingData.message ? `[Walk-in / Admin Entry] ${newBookingData.message}` : '[Walk-in / Admin Entry]',
      });

      if (res && res.appointment && newBookingData.status !== 'Pending') {
        // If admin wants it pre-confirmed
        await api.updateAppointmentStatus(res.appointment.id, newBookingData.status);
      }

      setFeedbackMsg({ type: 'success', text: `New appointment #${res.appointment.id} created successfully!` });
      setIsNewBookingOpen(false);
      // Reset form
      setNewBookingData({
        fullName: '',
        phone: '',
        email: '',
        appointmentType: REHAB_TREATMENTS[0],
        doctor: 'Dr. Iftikhar Ali',
        preferredDate: todayStr,
        preferredTime: '11:00 AM',
        status: 'Confirmed',
        message: '',
      });
      await loadDashboardData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create appointment.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export Appointments to CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) {
      setFeedbackMsg({ type: 'error', text: 'No appointments to export.' });
      return;
    }
    const headers = ['Ref ID', 'Patient Name', 'Phone', 'Email', 'Treatment', 'Doctor', 'Date', 'Time', 'Status', 'Created At'];
    const rows = filteredAppointments.map(a => [
      `"${a.id}"`,
      `"${(a.fullName || '').replace(/"/g, '""')}"`,
      `"${(a.phone || '').replace(/"/g, '""')}"`,
      `"${(a.email || '').replace(/"/g, '""')}"`,
      `"${(a.appointmentType || '').replace(/"/g, '""')}"`,
      `"${(a.doctor || '').replace(/"/g, '""')}"`,
      `"${a.preferredDate}"`,
      `"${a.preferredTime}"`,
      `"${a.status}"`,
      `"${a.createdAt}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sporc_clinic_appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedbackMsg({ type: 'success', text: `Exported ${filteredAppointments.length} appointments to CSV file.` });
  };

  // WhatsApp link helper
  const getWhatsAppLink = (phone: string, apt: Appointment) => {
    let cleanPhone = phone.replace(/[^\d]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum ${apt.fullName},\nThis is ${CLINIC_INFO.name} (${CLINIC_INFO.doctorName}), Rawalpindi.\n\nYour appointment is confirmed:\n📅 Date: ${apt.preferredDate}\n⏰ Time: ${apt.preferredTime}\n🏥 Clinic: ${CLINIC_INFO.address}\nRef ID: #${apt.id}\nStatus: ${apt.status}\n\nFor any questions, please contact reception at ${CLINIC_INFO.phone}.`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  // Today & Upcoming appointment calculations
  const todayAppointments = appointments.filter(a => a.preferredDate === todayStr);
  const todayConfirmed = todayAppointments.filter(a => a.status === 'Confirmed').length;
  const todayCompleted = todayAppointments.filter(a => a.status === 'Completed').length;
  const todayPending = todayAppointments.filter(a => a.status === 'Pending').length;

  const upcomingAppointments = appointments.filter(a => a.preferredDate > todayStr && a.status !== 'Cancelled');
  const totalPending = appointments.filter(a => a.status === 'Pending').length;
  const totalConfirmed = appointments.filter(a => a.status === 'Confirmed').length;
  const totalCompleted = appointments.filter(a => a.status === 'Completed').length;
  const totalCancelled = appointments.filter(a => a.status === 'Cancelled').length;

  // Filtered appointments by quickDateFilter
  const filteredAppointments = appointments.filter(a => {
    if (quickDateFilter === 'today') {
      return a.preferredDate === todayStr;
    }
    if (quickDateFilter === 'upcoming') {
      return a.preferredDate > todayStr && a.status !== 'Cancelled' && a.status !== 'Completed';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#101F50] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] pb-24 sm:pb-12">
      
      {/* Top Admin Header */}
      <header className="bg-[#101F50] text-white border-b border-[#0B1740] sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
          
          {/* Brand & Clinic Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onReturnToSite}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-gray-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              title="Return to Public Website"
              id="btn-admin-return-site"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit to Site</span>
            </button>

            <div className="h-6 w-px bg-white/15 hidden sm:block"></div>

            <div className="flex items-center gap-2 sm:gap-2.5 truncate">
              <img
                src={clinicImages.clinicLogo}
                alt="Clinic Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-contain bg-white/10 p-0.5 shrink-0 border border-white/15"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-xs sm:text-sm tracking-tight text-white truncate">
                    SPORC Clinic
                  </h1>
                  <span className="hidden xs:inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#008C78]/30 border border-[#008C78]/50 text-[10px] text-teal-300 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live DB
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 hidden sm:block truncate">
                  Rehabilitation &amp; Sports Therapy Portal • Dr. Iftikhar Ali, Rawalpindi
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Action: New Walk-in Booking */}
            <button
              onClick={() => setIsNewBookingOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#008C78] hover:bg-[#007665] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Add Walk-in Appointment"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">New Booking</span>
            </button>

            {/* Refresh */}
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors cursor-pointer"
              title="Refresh Real Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Desktop User Info & Logout */}
            <div className="hidden lg:flex items-center gap-2.5 pl-2 border-l border-white/15">
              {admin.isOneTimeSession && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border transition-colors ${
                    sessionTimeLeft < 60
                      ? 'bg-red-600/30 border-red-500/50 text-red-200 animate-pulse'
                      : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                  }`}
                  title="5-minute temporary session countdown"
                >
                  <Clock className={`w-3.5 h-3.5 ${sessionTimeLeft < 60 ? 'text-red-400' : 'text-amber-300'}`} />
                  <span>{formattedTimer}</span>
                </div>
              )}
              <div className="flex flex-col text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-white leading-tight">{admin.name}</span>
                  {admin.isOneTimeSession && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 border border-amber-400/40 text-[9px] font-bold text-amber-200">
                      1-Time
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-300">{admin.email}</span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Logout"
                id="btn-admin-logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-white/10 text-gray-200 hover:text-white cursor-pointer"
              aria-label="Open Admin Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 hidden sm:flex overflow-x-auto no-scrollbar gap-1 border-t border-white/10 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-overview"
          >
            Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('appointments');
              setQuickDateFilter('all');
              setStatusFilter('all');
            }}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-appointments"
          >
            <span>Appointments</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#008C78] text-white text-[10px]">
              {stats?.totalAppointments ?? appointments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'calendar'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-calendar"
          >
            Schedule Calendar
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'patients'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-patients"
          >
            <span>Patients Directory</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
              {stats?.totalPatients ?? patients.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'inquiries'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-inquiries"
          >
            <span>Contact Messages</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px]">
              {stats?.totalInquiries ?? inquiries.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'activity'
                ? 'border-[#008C78] text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
            id="admin-tab-activity"
          >
            Live Activity
          </button>
        </div>
      </header>

      {/* Quick Access Active Session Notice with 5-minute Countdown */}
      {admin.isOneTimeSession && (
        <div className={`border-b py-2.5 px-4 sm:px-8 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors ${
          sessionTimeLeft < 60
            ? 'bg-red-50 border-red-300 text-red-900 animate-pulse'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sessionTimeLeft < 60 ? 'bg-red-600 animate-ping' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="leading-relaxed">
              <strong>One-Time 5-Minute Session Active:</strong> You accessed the admin portal via one-time passcode (<code className="bg-amber-100 border border-amber-300 px-1 py-0.5 rounded text-amber-950 font-mono text-[11px]">irfan1212</code>).
              After 5 minutes, you will be automatically logged out and cannot login again with this passcode on this device.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border flex items-center gap-1.5 shadow-xs ${
              sessionTimeLeft < 60
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-amber-200 text-amber-950 border-amber-400'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-logout in:</span>
              <span className="text-sm font-black">{formattedTimer}</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 w-full">
        
        {/* Flash notification message */}
        {feedbackMsg && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Clinic Schedule & Database Overview Banner */}
            <div className="bg-linear-to-r from-[#101F50] to-[#1A3275] text-white p-4 sm:p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-teal-300">
                    Clinic Appointment Central • {todayStr}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-emerald-300">
                    Live Real Database ({appointments.length} Total Bookings)
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black font-['Manrope',sans-serif]">
                  {todayAppointments.length > 0
                    ? `${todayAppointments.length} Patient${todayAppointments.length === 1 ? '' : 's'} Scheduled for Today`
                    : `${appointments.length} Registered Patient Booking${appointments.length === 1 ? '' : 's'} in Clinic Database`}
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {todayAppointments.length > 0 ? (
                    <>
                      Today: <strong className="text-white">{todayConfirmed} confirmed</strong>, {todayPending} pending, {todayCompleted} completed. (Total active bookings in clinic: <strong className="text-teal-300">{appointments.length}</strong>)
                    </>
                  ) : (
                    <>
                      <strong>0 scheduled specifically for Today ({todayStr})</strong> • <strong className="text-emerald-300">{appointments.length} active booking(s) scheduled</strong> ({upcomingAppointments.length} upcoming/tomorrow, {totalPending} pending triage).
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={() => {
                    setActiveTab('appointments');
                    setQuickDateFilter('all');
                    setStatusFilter('all');
                  }}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-full bg-[#008C78] hover:bg-[#007665] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>View All Bookings ({appointments.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('appointments');
                    setQuickDateFilter('today');
                  }}
                  className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Filter only for today's queue"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Today's Queue ({todayAppointments.length})</span>
                </button>
                <button
                  onClick={() => setIsNewBookingOpen(true)}
                  className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Walk-in</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards (2 cols on mobile, 4 on desktop) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">Total Bookings</span>
                  <CalendarIcon className="w-4 h-4 text-[#008C78]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-['Manrope',sans-serif] text-[#101F50]">
                  {stats?.totalAppointments ?? appointments.length}
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Real database records</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600">Confirmed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-['Manrope',sans-serif] text-emerald-700">
                  {stats?.confirmedAppointments ?? appointments.filter(a => a.status === 'Confirmed').length}
                </div>
                <p className="text-[10px] sm:text-[11px] text-emerald-600/70 mt-1">Ready for consultation</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-600">Pending</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-['Manrope',sans-serif] text-amber-600">
                  {stats?.pendingAppointments ?? appointments.filter(a => a.status === 'Pending').length}
                </div>
                <p className="text-[10px] sm:text-[11px] text-amber-600/70 mt-1">Awaiting confirmation</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-600">Patients</span>
                  <Users className="w-4 h-4 text-[#008C78]" />
                </div>
                <div className="text-2xl sm:text-3xl font-black font-['Manrope',sans-serif] text-[#101F50]">
                  {stats?.totalPatients ?? patients.length}
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">Registered accounts</p>
              </div>
            </div>

            {/* Split layout: Recent Consultations vs Live System Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
              
              {/* Left: Recent Appointments */}
              <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-[#101F50]">Recent Bookings</h3>
                    <p className="text-xs text-[#53616A]">Live patient reservations in Rawalpindi clinic.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-bold text-[#008C78] hover:underline cursor-pointer"
                  >
                    View All &rarr;
                  </button>
                </div>

                {appointments.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs">
                    No appointments in database yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {appointments.slice(0, 6).map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-2xl border border-gray-100 hover:border-[#008C78]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-[#101F50] truncate">{apt.fullName}</span>
                            <span className="text-[10px] font-mono text-gray-400 shrink-0">#{apt.id}</span>
                          </div>
                          <div className="text-xs text-[#008C78] font-medium truncate">{apt.appointmentType}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {apt.preferredDate} at {apt.preferredTime}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {apt.status}
                          </span>

                          <button
                            onClick={() => setSelectedSlip(apt)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#008C78] hover:bg-white transition-colors cursor-pointer"
                            title="Print Token Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewingAppointment(apt)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#008C78] hover:bg-white transition-colors cursor-pointer"
                            title="View full details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Live System Activity */}
              <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#008C78]" />
                    <h3 className="font-bold text-base text-[#101F50]">Live Audit Log</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Real-Time Actions</span>
                </div>

                {activities.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No activity logged yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {activities.slice(0, 8).map((act) => (
                      <div key={act.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#101F50]">{act.action}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[#53616A] text-[11px] leading-relaxed">
                          {act.details}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS MANAGEMENT */}
        {activeTab === 'appointments' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Top Toolbar: Search, Filters & Export */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-lg sm:text-xl text-[#101F50]">Patient Appointments</h3>
                  <p className="text-xs text-[#53616A]">Direct management of verified consultation bookings.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#101F50] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Export currently filtered list to CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => setIsNewBookingOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#008C78] hover:bg-[#007665] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Walk-in</span>
                  </button>
                </div>
              </div>

              {/* Quick Filter Buttons / Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                <button
                  onClick={() => {
                    setQuickDateFilter('all');
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    quickDateFilter === 'all' && statusFilter === 'all'
                      ? 'bg-[#101F50] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All ({appointments.length})
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('today');
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    quickDateFilter === 'today'
                      ? 'bg-[#008C78] text-white'
                      : 'bg-teal-50 text-[#008C78] border border-teal-200 hover:bg-teal-100'
                  }`}
                >
                  <span>⚡ Today ({todayAppointments.length})</span>
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('upcoming');
                    setStatusFilter('all');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    quickDateFilter === 'upcoming'
                      ? 'bg-[#101F50] text-white shadow-xs'
                      : 'bg-indigo-50 text-[#101F50] border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span>📅 Upcoming ({upcomingAppointments.length})</span>
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('all');
                    setStatusFilter('Pending');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'Pending'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>Pending</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 text-[10px]">
                    {appointments.filter(a => a.status === 'Pending').length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('all');
                    setStatusFilter('Confirmed');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'Confirmed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span>Confirmed</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-[10px]">
                    {appointments.filter(a => a.status === 'Confirmed').length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('all');
                    setStatusFilter('Completed');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === 'Completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  Completed
                </button>

                <button
                  onClick={() => {
                    setQuickDateFilter('all');
                    setStatusFilter('Cancelled');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === 'Cancelled'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by patient name, phone, treatment, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#008C78] text-white text-xs font-bold hover:bg-[#007665] transition-colors cursor-pointer shrink-0"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Empty State */}
            {filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 rounded-full bg-teal-50 text-[#008C78] flex items-center justify-center mx-auto">
                  <CalendarIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-lg text-[#101F50]">
                    {quickDateFilter === 'today'
                      ? `No Appointments Scheduled Specifically for Today (${todayStr})`
                      : quickDateFilter === 'upcoming'
                      ? 'No Upcoming Appointments Found'
                      : 'No Appointments Found'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    {quickDateFilter === 'today' && appointments.length > 0
                      ? `You currently have ${appointments.length} total registered patient appointment(s) stored in your clinic database (scheduled on upcoming dates). Click "View All Bookings" below to see and manage them.`
                      : appointments.length > 0
                      ? `There are ${appointments.length} appointments in the system, but none match the current filter (${statusFilter !== 'all' ? statusFilter : quickDateFilter}).`
                      : 'No appointments have been booked in the system yet. You can book a walk-in patient anytime.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {appointments.length > 0 && (
                    <button
                      onClick={() => {
                        setQuickDateFilter('all');
                        setStatusFilter('all');
                        setSearchTerm('');
                      }}
                      className="px-5 py-2.5 rounded-full bg-[#008C78] hover:bg-[#007665] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>View All {appointments.length} Bookings</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setQuickDateFilter('all');
                      setStatusFilter('all');
                      setSearchTerm('');
                      loadDashboardData();
                    }}
                    className="px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#101F50] transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setIsNewBookingOpen(true)}
                    className="px-4 py-2.5 rounded-full bg-[#101F50] hover:bg-[#1A3275] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Add Walk-in
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. MOBILE APPOINTMENT CARDS (Visible on mobile screens < md) */}
                <div className="block md:hidden space-y-3">
                  {filteredAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs space-y-3 transition-all hover:border-[#008C78]"
                    >
                      {/* Card Header: Ref ID, Status, Date/Time */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                            #{apt.id}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : apt.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : apt.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold text-[#101F50] bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">
                          <Clock className="w-3 h-3 text-[#008C78]" />
                          <span>{apt.preferredTime}</span>
                        </div>
                      </div>

                      {/* Patient & Service Info */}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base text-[#101F50]">{apt.fullName}</h4>
                          <span className="text-[11px] text-gray-500 font-medium">{apt.preferredDate}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#008C78] mt-0.5">
                          {apt.appointmentType}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                          <span>{apt.phone}</span>
                          {apt.email && <span className="text-gray-400">• {apt.email}</span>}
                        </div>
                      </div>

                      {/* Attachments Indicator if any */}
                      {apt.attachments && apt.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                          <Paperclip className="w-3 h-3 text-emerald-600" />
                          <span>{apt.attachments.length} medical file(s) attached</span>
                        </div>
                      )}

                      {/* Patient Note snippet if any */}
                      {apt.message && (
                        <p className="text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded-xl border border-gray-100 line-clamp-2">
                          "{apt.message}"
                        </p>
                      )}

                      {/* Mobile Touch Action Buttons (Touch targets >= 44px) */}
                      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        
                        {/* Direct Contact Icons: Call & WhatsApp */}
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${apt.phone}`}
                            className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors border border-emerald-200"
                            title="Call Patient"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          <a
                            href={getWhatsAppLink(apt.phone, apt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-2xs"
                            title="Send WhatsApp Confirmation"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => setSelectedSlip(apt)}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#101F50] flex items-center justify-center transition-colors"
                            title="View & Print Digital Token Slip"
                          >
                            <Printer className="w-4 h-4 text-[#008C78]" />
                          </button>

                          <button
                            onClick={() => setViewingAppointment(apt)}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#101F50] flex items-center justify-center transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quick Status Changers */}
                        <div className="flex items-center gap-1.5">
                          {apt.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                              disabled={actionLoading}
                              className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm</span>
                            </button>
                          )}

                          {apt.status === 'Confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                              disabled={actionLoading}
                              className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setReschedulingAppointment(apt);
                              setNewDate(apt.preferredDate);
                              setNewTime(apt.preferredTime);
                            }}
                            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer"
                            title="Reschedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmAppointment(apt)}
                            className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center cursor-pointer border border-red-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. DESKTOP APPOINTMENTS TABLE (Visible on screens >= md) */}
                <div className="hidden md:block bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-[10px]">
                          <th className="py-3.5 px-4">Ref ID</th>
                          <th className="py-3.5 px-4">Patient Name</th>
                          <th className="py-3.5 px-4">Contact</th>
                          <th className="py-3.5 px-4">Treatment</th>
                          <th className="py-3.5 px-4">Date &amp; Time</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-gray-400">
                              #{apt.id}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-sm text-[#101F50]">{apt.fullName}</div>
                              <div className="text-[11px] text-gray-400">Dr. Iftikhar Ali</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 font-medium text-[#101F50]">
                                <span>{apt.phone}</span>
                                <a
                                  href={`tel:${apt.phone}`}
                                  className="text-gray-400 hover:text-emerald-600 p-0.5"
                                  title="Call"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                                <a
                                  href={getWhatsAppLink(apt.phone, apt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-emerald-600 p-0.5"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </a>
                              </div>
                              <div className="text-[11px] text-gray-400">{apt.email}</div>
                            </td>
                            <td className="py-4 px-4 font-medium text-[#008C78]">
                              <div className="font-semibold">{apt.appointmentType}</div>
                              {apt.attachments && apt.attachments.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {apt.attachments.length} attachment(s)
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-[#101F50]">{apt.preferredDate}</div>
                              <div className="text-[11px] text-gray-500">{apt.preferredTime}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                apt.status === 'Confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : apt.status === 'Completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {apt.status === 'Pending' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'Confirmed')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Confirm Appointment"
                                  >
                                    Confirm
                                  </button>
                                )}

                                {apt.status === 'Confirmed' && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'Completed')}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Mark as Completed"
                                  >
                                    Complete
                                  </button>
                                )}

                                <button
                                  onClick={() => setSelectedSlip(apt)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#008C78] hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="Print Official Token Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setViewingAppointment(apt)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#008C78] hover:bg-gray-100 transition-colors cursor-pointer"
                                  title="View full details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setReschedulingAppointment(apt);
                                    setNewDate(apt.preferredDate);
                                    setNewTime(apt.preferredTime);
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Reschedule"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setDeleteConfirmAppointment(apt)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* TAB 3: CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-[#101F50]">Clinical Appointment Calendar</h3>
                <p className="text-xs text-[#53616A]">Real schedule mapped to booked dates at SPORC Clinic, Rawalpindi.</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Confirmed</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pending</span>
              </div>
            </div>

            {/* List of Scheduled Days */}
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  No appointments scheduled on calendar.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 sm:p-5 rounded-2xl border border-gray-200 hover:border-[#008C78] bg-gray-50/50 space-y-3 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm text-[#101F50]">
                          <CalendarIcon className="w-4 h-4 text-[#008C78]" />
                          <span>{apt.preferredDate}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#008C78] bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                          {apt.preferredTime}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-[#101F50]">{apt.fullName}</h4>
                        <p className="text-xs text-[#008C78] font-semibold">{apt.appointmentType}</p>
                        <p className="text-xs text-gray-500">{apt.phone}</p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedSlip(apt)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#008C78] cursor-pointer"
                            title="Slip"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewingAppointment(apt)}
                            className="text-[#008C78] hover:underline font-bold cursor-pointer"
                          >
                            Details &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PATIENTS DIRECTORY */}
        {activeTab === 'patients' && (
          <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-[#101F50]">Registered Patients &amp; Members</h3>
              <p className="text-xs text-[#53616A]">Patient records and consultation histories stored in the clinic database.</p>
            </div>

            {patients.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No registered patient records in database yet.
              </div>
            ) : (
              <>
                {/* Mobile Patients Card View */}
                <div className="block sm:hidden space-y-3">
                  {patients.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#008C78]/10 text-[#008C78] font-bold text-sm flex items-center justify-center">
                            {(p.fullName || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#101F50]">{p.fullName}</h4>
                            <span className="text-[10px] text-gray-400">
                              Joined {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 text-[#008C78] font-bold text-[10px] border border-teal-100">
                          {p.totalAppointments || (appointments.filter(a => a.email.toLowerCase() === p.email.toLowerCase()).length)} bookings
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 flex flex-col gap-1 pt-1">
                        {p.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Phone:</span>
                            <a href={`tel:${p.phone}`} className="font-mono font-bold text-[#008C78] hover:underline">
                              {p.phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-gray-700 truncate">{p.email}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Patients Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-bold text-[10px]">
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Total Bookings</th>
                        <th className="py-3 px-4">Member Since</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patients.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-4 px-4 font-bold text-[#101F50]">{p.fullName}</td>
                          <td className="py-4 px-4 text-gray-600">{p.email}</td>
                          <td className="py-4 px-4 font-mono text-gray-600">{p.phone || 'N/A'}</td>
                          <td className="py-4 px-4 font-bold text-[#008C78]">
                            {p.totalAppointments || (appointments.filter(a => a.email.toLowerCase() === p.email.toLowerCase()).length)} bookings
                          </td>
                          <td className="py-4 px-4 text-gray-400">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 5: CONTACT INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-[#101F50]">Patient Inquiries &amp; Messages</h3>
              <p className="text-xs text-[#53616A]">Direct messages sent through the online clinic contact portal.</p>
            </div>

            {inquiries.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No contact inquiries received yet.
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#101F50]">{inq.fullName}</span>
                        <span className="text-xs text-gray-400 font-mono">({inq.email})</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(inq.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-[#008C78]">Subject: {inq.subject}</div>
                    <p className="text-xs text-[#53616A] bg-white p-3 rounded-xl border border-gray-100 leading-relaxed">
                      {inq.message}
                    </p>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      {inq.phone && (
                        <a
                          href={`tel:${inq.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call {inq.phone}</span>
                        </a>
                      )}
                      <a
                        href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                        className="px-3 py-1.5 rounded-lg bg-[#008C78] text-white text-xs font-bold hover:bg-[#007665] flex items-center gap-1"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Reply via Email</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: GENUINE LIVE ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="bg-white p-4 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-[#101F50]">System Audit &amp; Live Activity</h3>
              <p className="text-xs text-[#53616A]">Audited activity log generated strictly by real user and admin interactions.</p>
            </div>

            {/* One-Time Access Passcode Security Card */}
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#008C78]/15 text-[#008C78] flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#101F50] flex items-center gap-2">
                    <span>Two-Time Quick Access Policy</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Configured &amp; Active (2 Uses)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#53616A] mt-0.5 leading-relaxed">
                    Quick access passcode is set to <code className="bg-white px-1.5 py-0.5 rounded border border-teal-200 text-teal-950 font-mono font-bold text-[11px]">irfan1212</code>. Authorized personnel can redeem this code up to <strong>two times (2 uses)</strong> on any device before it locks that device.
                  </p>
                </div>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No activity records found.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="p-3.5 sm:p-4 rounded-2xl border border-gray-100 bg-gray-50/80 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#008C78]/10 text-[#008C78] flex items-center justify-center shrink-0 mt-0.5">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#101F50]">{act.action}</span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(act.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-[#53616A] text-xs leading-relaxed">
                        {act.details}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR (Visible on mobile screens < sm) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl py-1.5 px-3 flex justify-around items-center">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'overview' ? 'text-[#008C78]' : 'text-gray-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold">Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('appointments');
            setQuickDateFilter('all');
            setStatusFilter('all');
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors relative cursor-pointer ${
            activeTab === 'appointments' ? 'text-[#008C78]' : 'text-gray-500'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">Bookings</span>
          {todayPending > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          )}
        </button>

        {/* Center Action: Walk-in Booking Button */}
        <button
          onClick={() => setIsNewBookingOpen(true)}
          className="w-11 h-11 rounded-full bg-[#008C78] text-white flex items-center justify-center shadow-lg -mt-4 border-2 border-white cursor-pointer active:scale-95 transition-transform"
          title="New Appointment"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'calendar' ? 'text-[#008C78]' : 'text-gray-500'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Calendar</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-gray-500 hover:text-[#101F50] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">Menu</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xs h-full p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img
                  src={clinicImages.clinicLogo}
                  alt="Logo"
                  className="w-8 h-8 rounded-xl object-contain bg-gray-100 p-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-[#101F50]">{admin.name}</h3>
                    {admin.isOneTimeSession && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">
                        1-Time (5m)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">{admin.email}</p>
                  {admin.isOneTimeSession && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                      <span>Expires in {formattedTimer}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-1 flex-1 overflow-y-auto">
              <span className="text-[10px] uppercase font-bold text-gray-400 px-3">Navigation</span>
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'overview' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('appointments');
                  setQuickDateFilter('all');
                  setStatusFilter('all');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'appointments' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4" />
                  <span>All Appointments</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                  {appointments.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'calendar' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Schedule Calendar</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('patients');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'patients' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Patients Directory</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                  {patients.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('inquiries');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'inquiries' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" />
                  <span>Contact Inquiries</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
                  {inquiries.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('activity');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'activity' ? 'bg-[#008C78]/10 text-[#008C78]' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Live Audit Log</span>
              </button>

              <div className="pt-3 pb-1 border-t border-gray-100">
                <span className="text-[10px] uppercase font-bold text-gray-400 px-3">Quick Actions</span>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsNewBookingOpen(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-[#008C78] hover:bg-teal-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Walk-in Appointment</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleExportCSV();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Export Appointments CSV</span>
              </button>
            </div>

            {/* Drawer Footer: Exit to site & Logout */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <button
                onClick={onReturnToSite}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#101F50] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Public Website</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WALK-IN / NEW BOOKING MODAL */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#008C78]/10 text-[#008C78] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#101F50]">New Walk-in Booking</h3>
                  <p className="text-xs text-gray-500">Add appointment on behalf of patient</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewBookingOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#101F50] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Aslam"
                  value={newBookingData.fullName}
                  onChange={(e) => setNewBookingData({ ...newBookingData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="03001234567"
                    value={newBookingData.phone}
                    onChange={(e) => setNewBookingData({ ...newBookingData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="patient@example.com"
                    value={newBookingData.email}
                    onChange={(e) => setNewBookingData({ ...newBookingData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#101F50] mb-1">ENT Treatment / Service *</label>
                <select
                  value={newBookingData.appointmentType}
                  onChange={(e) => setNewBookingData({ ...newBookingData, appointmentType: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden bg-white"
                >
                  {REHAB_TREATMENTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Consultation Date *</label>
                  <input
                    type="date"
                    required
                    value={newBookingData.preferredDate}
                    onChange={(e) => setNewBookingData({ ...newBookingData, preferredDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Time Slot *</label>
                  <input
                    type="text"
                    required
                    placeholder="11:00 AM"
                    value={newBookingData.preferredTime}
                    onChange={(e) => setNewBookingData({ ...newBookingData, preferredTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Initial Status</label>
                  <select
                    value={newBookingData.status}
                    onChange={(e) => setNewBookingData({ ...newBookingData, status: e.target.value as AppointmentStatus })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden bg-white"
                  >
                    <option value="Confirmed">Confirmed (Pre-approved)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#101F50] mb-1">Assigned Specialist</label>
                  <input
                    type="text"
                    disabled
                    value={newBookingData.doctor}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#101F50] mb-1">Clinical Notes / Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Walk-in patient at clinic reception reporting nasal blockage and headache"
                  value={newBookingData.message}
                  onChange={(e) => setNewBookingData({ ...newBookingData, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-[#008C78] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-full bg-[#008C78] hover:bg-[#007665] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading ? 'Saving...' : 'Confirm & Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {viewingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gray-400">
                    Ref #{viewingAppointment.id}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    viewingAppointment.status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : viewingAppointment.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800'
                      : viewingAppointment.status === 'Completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingAppointment.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#101F50] mt-0.5">{viewingAppointment.fullName}</h3>
              </div>
              <button
                onClick={() => setViewingAppointment(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#101F50]">
              
              {/* Quick Communication Bar */}
              <div className="p-3 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#008C78]" />
                  <span className="font-bold text-xs text-[#101F50]">{viewingAppointment.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${viewingAppointment.phone}`}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#101F50] border border-gray-200 hover:bg-gray-50 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>Call</span>
                  </a>
                  <a
                    href={getWhatsAppLink(viewingAppointment.phone, viewingAppointment)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Treatment:</span>
                  <span className="font-bold text-[#008C78]">{viewingAppointment.appointmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Doctor:</span>
                  <span className="font-bold">{viewingAppointment.doctor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Date &amp; Time:</span>
                  <span className="font-bold">{viewingAppointment.preferredDate} at {viewingAppointment.preferredTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-gray-700">{viewingAppointment.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Booked On:</span>
                  <span className="font-medium text-gray-600">
                    {new Date(viewingAppointment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {viewingAppointment.message && (
                <div>
                  <span className="text-gray-400 uppercase font-bold text-[10px]">Patient Notes:</span>
                  <p className="p-3 rounded-xl bg-gray-50 italic text-gray-600 mt-1">
                    "{viewingAppointment.message}"
                  </p>
                </div>
              )}

              {viewingAppointment.attachments && viewingAppointment.attachments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#008C78]" />
                    <span className="text-gray-400 uppercase font-bold text-[10px]">
                      Patient Attached Medical Files ({viewingAppointment.attachments.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {viewingAppointment.attachments.map((file, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <FileText className="w-4 h-4 text-[#008C78] shrink-0" />
                          <span className="font-semibold text-[#101F50] text-xs truncate">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-gray-500 shrink-0">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        {file.dataUrl ? (
                          <a
                            href={file.dataUrl}
                            download={file.name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#008C78] hover:bg-[#007665] text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Attached</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedSlip(viewingAppointment);
                }}
                className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#008C78] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>

              <div className="flex items-center gap-2">
                {viewingAppointment.status === 'Pending' && (
                  <button
                    onClick={() => handleUpdateStatus(viewingAppointment.id, 'Confirmed')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                )}
                {viewingAppointment.status === 'Confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(viewingAppointment.id, 'Completed')}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => setViewingAppointment(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {reschedulingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs uppercase font-bold text-amber-600">Admin Action</span>
                <h3 className="text-lg font-bold text-[#101F50]">Reschedule Appointment</h3>
                <p className="text-xs text-gray-500">Patient: {reschedulingAppointment.fullName}</p>
              </div>
              <button
                onClick={() => setReschedulingAppointment(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#101F50] mb-1">New Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#008C78] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#101F50] mb-1">New Time Slot</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 11:30 AM"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:border-[#008C78] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppointment(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-gray-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full bg-[#008C78] text-white text-xs font-bold hover:bg-[#007665] cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101F50]">Confirm Deletion</h3>
                <p className="text-xs text-gray-500">Permanent Database Record Removal</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to permanently delete appointment <span className="font-mono font-bold text-gray-800">#{deleteConfirmAppointment.id}</span> for <span className="font-semibold text-gray-800">{deleteConfirmAppointment.fullName}</span>? This action cannot be undone.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmAppointment(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirmAppointment.id)}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT SLIP MODAL (View & Print) */}
      <AppointmentSlipModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        appointment={selectedSlip}
      />

    </div>
  );
};
