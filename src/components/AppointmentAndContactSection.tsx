import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChevronDown,
  Send, 
  MapPin, 
  MessageSquare, 
  Building2, 
  ExternalLink, 
  ShieldCheck,
  Stethoscope,
  Check,
  FileText,
  HeartPulse,
  Paperclip,
  Upload,
  X,
  Printer,
  Share2,
  Copy,
  Search,
  FileCheck
} from 'lucide-react';
import { SERVICES, CLINIC_INFO } from '../data/clinicData';
import { clinicImages } from '../assets';
import { api } from '../services/api';
import { Appointment, AppointmentAttachment } from '../types';
import { AppointmentSlipModal } from './AppointmentSlipModal';

interface AppointmentAndContactSectionProps {
  initialServiceId?: string;
  onAppointmentCreated?: (appointment: Appointment) => void;
}

export const AppointmentAndContactSection: React.FC<AppointmentAndContactSectionProps> = ({
  initialServiceId,
  onAppointmentCreated,
}) => {
  // Mode: 'book' or 'track'
  const [appointmentMode, setAppointmentMode] = useState<'book' | 'track'>('book');

  // Appointment Form State
  const [selectedService, setSelectedService] = useState<string>(
    initialServiceId 
      ? (SERVICES.find(s => s.id === initialServiceId)?.title || SERVICES[0].title)
      : SERVICES[0].title
  );
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('11:00 AM');
  const [notes, setNotes] = useState('');
  
  // Patient Reference File Attachments
  const [attachments, setAttachments] = useState<AppointmentAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Official Appointment Slip Modal State
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipAppointment, setSlipAppointment] = useState<Appointment | null>(null);

  // Appointment Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResults, setTrackResults] = useState<Appointment[] | null>(null);
  const [trackError, setTrackError] = useState('');

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Update selected service if parent prop changes
  useEffect(() => {
    if (initialServiceId) {
      const found = SERVICES.find(s => s.id === initialServiceId);
      if (found) setSelectedService(found.title);
    }
  }, [initialServiceId]);

  const timeSlots = [
    '10:30 AM', '11:15 AM', '12:00 PM', '01:00 PM', 
    '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM'
  ];

  // File Upload Handlers
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError('');

    if (attachments.length + files.length > 4) {
      setFileError('You can attach a maximum of 4 reference documents.');
      return;
    }

    Array.from(files).forEach((file) => {
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            dataUrl,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!patientName || !patientPhone || !patientEmail || !selectedDate || !selectedTime) {
      setBookingError('Please complete all required appointment fields.');
      return;
    }

    try {
      setBookingLoading(true);
      const res = await api.bookAppointment({
        fullName: patientName,
        phone: patientPhone,
        email: patientEmail,
        appointmentType: selectedService,
        doctor: CLINIC_INFO.doctorName,
        preferredDate: selectedDate,
        preferredTime: selectedTime,
        message: notes,
        attachments: attachments,
      });

      setBookingSuccess(res.appointment);
      setSlipAppointment(res.appointment);
      if (onAppointmentCreated) {
        onAppointmentCreated(res.appointment);
      }
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    if (!trackQuery.trim()) {
      setTrackError('Please enter your Appointment Ref # (e.g. APT-1001) or phone number.');
      return;
    }

    try {
      setTrackLoading(true);
      const results = await api.lookupAppointments(trackQuery);
      setTrackResults(results);
      if (results.length === 0) {
        setTrackError('No appointment records found matching your reference or phone.');
      }
    } catch (err: any) {
      setTrackError(err.message || 'Error searching appointment.');
      setTrackResults([]);
    } finally {
      setTrackLoading(false);
    }
  };

  const copyAppointmentRef = (token: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(token).catch(() => {
          // Fallback if clipboard API permission is denied
          const textArea = document.createElement('textarea');
          textArea.value = token;
          textArea.style.position = 'fixed';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (e) {
            // ignore
          }
          document.body.removeChild(textArea);
        });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = token;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (e) {
          // ignore
        }
        document.body.removeChild(textArea);
      }
    } catch {
      // safe fallback
    }
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2200);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');

    if (!contactName || !contactEmail || !contactMessage) {
      setContactError('Please complete Name, Email, and Message.');
      return;
    }

    try {
      setContactLoading(true);
      await api.submitContact({
        fullName: contactName,
        email: contactEmail,
        phone: contactPhone,
        subject: contactSubject || 'General Rehabilitation Inquiry',
        message: contactMessage,
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      setContactError(err.message || 'Failed to send inquiry.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <section id="appointment" className="py-20 lg:py-28 bg-gradient-to-b from-[#F4F8F6] via-[#EDF5F2] to-[#F5F8F7] relative overflow-hidden">
      
      {/* 3D Glass Ambient Background Glows */}
      <div className="absolute top-0 right-0 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-[#008C78]/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 left-0 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-[#101F50]/8 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full overflow-hidden">
        
        {/* Unified Section Header with whileInView reveal */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3.5"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#008C78] text-xs font-extrabold uppercase tracking-widest border border-white/80 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#008C78] animate-pulse"></span>
            <span>Fast Clinical Scheduling &amp; Direct Contact</span>
          </div>

          <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#101F50] tracking-tight">
            Schedule your visit or <span className="font-serif italic font-normal text-[#008C78]">get in touch</span>
          </h2>

          <p className="text-sm sm:text-base text-[#53616A] leading-relaxed max-w-2xl mx-auto">
            Reserve a consultation with {CLINIC_INFO.doctorName} at {CLINIC_INFO.name}, opposite Benazir Bhutto Hospital, Murree Road, Rawalpindi, or send our clinic staff a direct message.
          </p>
        </motion.div>

        {/* Combined 2-Column Split: Booking on Left (Col 7) + Get in Touch & Contact on Right (Col 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
          
          {/* LEFT: Appointment Form & Patient Services Hub */}
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="lg:col-span-7 bg-[#EDF2EC] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 border border-[#E0E7E0] shadow-[0_12px_36px_rgba(20,40,30,0.04)] relative overflow-hidden"
          >
            {/* Top Bar: Doctor Avatar & Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#008C78] text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white ring-2 ring-[#008C78]/20">
                  IA
                </div>
                <div>
                  <span className="font-semibold text-[15px] text-[#1B2720] block leading-tight">
                    {CLINIC_INFO.doctorName}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Sports &amp; Orthopedic Rehab • {CLINIC_INFO.name}
                  </span>
                </div>
              </div>

              {/* Mode Toggle: Book vs Track Token */}
              <div className="flex items-center gap-1 p-1 bg-white/80 rounded-2xl border border-gray-200/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setAppointmentMode('book')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    appointmentMode === 'book'
                      ? 'bg-[#198754] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#198754]'
                  }`}
                >
                  Book Visit
                </button>
                <button
                  type="button"
                  onClick={() => setAppointmentMode('track')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    appointmentMode === 'track'
                      ? 'bg-[#101F50] text-white shadow-xs'
                      : 'text-gray-600 hover:text-[#101F50]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track Token</span>
                </button>
              </div>
            </div>

            {/* Headline */}
            <h3 className="font-['Manrope',sans-serif] font-bold text-2xl sm:text-[26px] md:text-[28px] text-[#1A261E] tracking-tight leading-snug mb-5">
              {appointmentMode === 'book'
                ? 'Schedule a consultation for expert diagnosis'
                : 'Track your appointment status & digital slip'}
            </h3>

            {/* TRACK APPOINTMENT MODE */}
            {appointmentMode === 'track' ? (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-[#4D5850]">
                  Enter your Appointment Reference Code (e.g. <span className="font-mono font-bold text-[#101F50]">APT-1001</span>) or registered phone number to verify booking status and print your official token slip.
                </p>

                <form onSubmit={handleTrackSubmit} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        placeholder="e.g. APT-1001 or 03009559255"
                        className="w-full bg-white rounded-xl sm:rounded-2xl pl-10 pr-4 py-3 sm:py-3.5 text-sm font-semibold text-[#1A261E] placeholder:text-gray-400 border border-gray-200/80 focus:border-[#101F50] focus:ring-2 focus:ring-[#101F50]/20 focus:outline-none transition-all shadow-2xs"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#101F50] hover:bg-[#0B1536] text-white font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {trackLoading ? (
                        <span>Searching...</span>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Check Status</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {trackError && (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs border border-amber-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>{trackError}</span>
                  </div>
                )}

                {trackResults && trackResults.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                      <span>Found {trackResults.length} Matching Appointment(s)</span>
                    </div>

                    {trackResults.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/90 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-[#198754] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                              #{apt.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${
                              apt.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'Completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-gray-600">
                            {apt.preferredDate}
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm space-y-1">
                          <div className="font-bold text-[#101F50] text-sm sm:text-base">
                            {apt.fullName}
                          </div>
                          <div className="text-gray-600">
                            Procedure: <span className="font-semibold text-gray-800">{apt.appointmentType}</span>
                          </div>
                          <div className="text-gray-600">
                            Slot: <span className="font-semibold text-[#198754]">{apt.preferredTime}</span> with {apt.doctor}
                          </div>
                          {apt.attachments && apt.attachments.length > 0 && (
                            <div className="text-emerald-700 font-medium pt-1 flex items-center gap-1.5 text-xs">
                              <Paperclip className="w-3.5 h-3.5 text-[#198754]" />
                              <span>{apt.attachments.length} Reference Medical Document(s) attached</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              setSlipAppointment(apt);
                              setShowSlipModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#198754] hover:bg-[#157347] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Official Slip</span>
                          </button>

                          <a
                            href={`https://api.whatsapp.com/send?phone=923009559255&text=${encodeURIComponent(
                              `*PATIENT APPOINTMENT STATUS ENQUIRY*\nRef: #${apt.id}\nPatient: ${apt.fullName}\nDate: ${apt.preferredDate} at ${apt.preferredTime}\nStatus: ${apt.status}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-colors shadow-2xs"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Notify on WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : bookingSuccess ? (
              /* APPOINTMENT BOOKED NOTIFICATION HUB */
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-4 space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-[#198754]/10 text-[#198754] flex items-center justify-center mx-auto border-2 border-[#198754]/30 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-[#14422B] text-xs font-bold border border-emerald-300 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#198754] animate-pulse"></span>
                    <span>Instant Booking Confirmed</span>
                  </div>

                  <h4 className="text-2xl font-bold text-[#1A261E] font-['Manrope',sans-serif]">
                    Appointment Confirmed!
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4D5850] max-w-sm mx-auto">
                    Reference code: <span className="font-mono font-extrabold text-[#198754] bg-white px-2 py-0.5 rounded border border-emerald-200">#{bookingSuccess.id}</span>
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl max-w-md mx-auto text-left text-xs sm:text-sm space-y-2 border border-emerald-200/80 shadow-2xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Patient:</span>
                    <span className="font-bold text-[#1A261E]">{bookingSuccess.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Contact:</span>
                    <span className="font-semibold text-gray-700">{bookingSuccess.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Treatment:</span>
                    <span className="font-bold text-[#198754]">{bookingSuccess.appointmentType}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-gray-500 font-medium">Scheduled Time:</span>
                    <span className="font-bold text-[#1A261E]">{bookingSuccess.preferredDate} at {bookingSuccess.preferredTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Consultation Fee:</span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {CLINIC_INFO.consultationFee}
                    </span>
                  </div>

                  {bookingSuccess.attachments && bookingSuccess.attachments.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <span className="text-gray-500 font-medium block text-xs">
                        Attached Reference Documents ({bookingSuccess.attachments.length}):
                      </span>
                      {bookingSuccess.attachments.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded-lg">
                          <FileText className="w-3.5 h-3.5 text-[#198754] shrink-0" />
                          <span className="truncate font-semibold">{file.name}</span>
                          <span className="text-[10px] text-gray-400 ml-auto">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Actions & Notifications */}
                <div className="max-w-md mx-auto space-y-2.5">
                  {/* WhatsApp Notification Direct Action */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=923005100088&text=${encodeURIComponent(
                      `*NEW APPOINTMENT BOOKING CONFIRMATION*\nRef: #${bookingSuccess.id}\nPatient: ${bookingSuccess.fullName}\nPhone: ${bookingSuccess.phone}\nService: ${bookingSuccess.appointmentType}\nSchedule: ${bookingSuccess.preferredDate} at ${bookingSuccess.preferredTime}\nClinic: ${CLINIC_INFO.name}, Opposite Benazir Bhutto Hospital, Murree Road, Rawalpindi\nPlease confirm reception queue.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-[#25D366]/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Notify Clinic on WhatsApp</span>
                  </a>

                  {/* View / Print Official Slip & Copy Ref */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSlipAppointment(bookingSuccess);
                        setShowSlipModal(true);
                      }}
                      className="py-3 px-3 rounded-full bg-[#101F50] hover:bg-[#0B1536] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Official Slip</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyAppointmentRef(`#${bookingSuccess.id}`)}
                      className="py-3 px-3 rounded-full bg-white hover:bg-gray-50 text-[#1A261E] border border-gray-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedToken ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#198754]" />
                          <span className="text-[#198754]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>Copy Ref ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setPatientName('');
                      setPatientPhone('');
                      setPatientEmail('');
                      setNotes('');
                      setAttachments([]);
                    }}
                    className="w-full py-2 rounded-full text-xs font-semibold text-gray-600 hover:text-[#198754] transition-colors cursor-pointer"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </motion.div>
            ) : (
              /* BOOKING FORM */
              <form onSubmit={handleBookingSubmit} className="space-y-4" id="form-appointment-booking">
                
                {bookingError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Row 1: Full name & Email address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="David Smith"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-white rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm text-[#1A261E] placeholder:text-gray-400 border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs"
                      id="input-patient-name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="david@gmail.com"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full bg-white rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm text-[#1A261E] placeholder:text-gray-400 border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs"
                      id="input-patient-email"
                    />
                  </div>
                </div>

                {/* Row 2: Phone number & Preferred time (with date & slot) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+92 300 9559255"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-white rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 text-sm text-[#1A261E] placeholder:text-gray-400 border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs"
                      id="input-patient-phone"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                      Preferred time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-white rounded-xl sm:rounded-2xl px-3 py-3 sm:py-3.5 text-xs sm:text-sm text-[#1A261E] border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs cursor-pointer"
                        id="input-appointment-date"
                        title="Select Date"
                      />
                      <div className="relative">
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="w-full bg-white rounded-xl sm:rounded-2xl pl-3.5 pr-8 py-3 sm:py-3.5 text-xs sm:text-sm text-[#1A261E] border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none appearance-none transition-all shadow-2xs cursor-pointer"
                          id="select-appointment-time"
                        >
                          <option value="" disabled>Choose a time</option>
                          {timeSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 3: Anything you'd like me to know beforehand? */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                    Anything you'd like me to know beforehand?
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g Ear discharge for 2 weeks, sinus pressure, difficulty swallowing..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white rounded-2xl p-4 text-sm text-[#1A261E] placeholder:text-gray-400 border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs resize-none"
                    id="input-appointment-notes"
                  />
                </div>

                {/* Row 4: Attach Reference Files (Prescriptions / Reports / Scans) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850]">
                      Attach Medical Reports / Prescriptions <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-gray-400">PDF, JPG, PNG up to 5MB</span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-3.5 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-[#198754] bg-[#198754]/10' 
                        : 'border-emerald-300/80 hover:border-[#198754] bg-white/70 hover:bg-white'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFiles(e.target.files)}
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                      className="hidden"
                      id="input-patient-attachments"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#198754]/10 text-[#198754] flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-xs font-bold text-[#1A261E]">
                          Click to upload or drag &amp; drop reference files
                        </p>
                        <p className="text-[11px] text-[#4D5850]">
                          Attach audiograms, CT scans, prior prescriptions, or ear/throat photos
                        </p>
                      </div>
                    </div>
                  </div>

                  {fileError && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{fileError}</p>
                  )}

                  {/* Attached files chips */}
                  {attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-emerald-200/80 shadow-2xs text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <FileText className="w-4 h-4 text-[#198754] shrink-0" />
                            <span className="font-semibold text-[#1A261E] truncate">{file.name}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({(file.size / 1024).toFixed(0)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(idx);
                            }}
                            className="w-5 h-5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Service Selector (Dedicated Box Type Input) */}
                <div>
                  <label className="block text-xs sm:text-[13px] font-medium text-[#4D5850] mb-1.5">
                    Select Rehabilitation Service / Procedure
                  </label>
                  <div className="relative">
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full bg-white rounded-xl sm:rounded-2xl px-4 py-3 sm:py-3.5 pr-10 text-sm font-semibold text-[#1A261E] border border-gray-200/60 focus:border-[#198754] focus:ring-2 focus:ring-[#198754]/20 focus:outline-none transition-all shadow-2xs cursor-pointer appearance-none"
                      id="select-appointment-service"
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Consultation Fee (Separate Highlighted Box) */}
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-300/80 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#198754]/12 text-[#198754] flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#14422B] block truncate">
                        Doctor Consultation Fee
                      </span>
                      <span className="text-[11px] text-gray-500 block truncate">
                        Fixed rate • Pay at clinic reception
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#198754] to-[#126b42] text-white font-extrabold text-xs sm:text-[13px] shadow-xs tracking-tight shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                    Fee: {CLINIC_INFO.consultationFee}
                  </span>
                </div>

                {/* Green Pill Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={bookingLoading}
                  className="w-full py-4 rounded-full bg-[#198754] hover:bg-[#157347] text-white font-semibold text-sm sm:text-base transition-all duration-200 shadow-md shadow-[#198754]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                  id="btn-confirm-appointment"
                >
                  <span>{bookingLoading ? 'Booking Appointment...' : 'Book Appointment'}</span>
                </motion.button>
              </form>
            )}
          </motion.div>

          {/* RIGHT: Clinic Info & Direct Message Hub with staged reveals */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Clinic Location & Contact Cards - Enhanced Pretty Medical Palette */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="relative overflow-hidden bg-gradient-to-br from-white via-[#F5FAF8] to-[#EBF6F2] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#008C78]/25 shadow-[0_20px_50px_rgba(0,140,120,0.08)] space-y-4"
            >
              {/* Decorative Corner Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-[#008C78]/15 via-[#008C78]/5 to-transparent rounded-tr-3xl pointer-events-none"></div>

              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#008C78]/15 gap-2 relative z-10">
                <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#008C78] uppercase tracking-wider bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#008C78]/20 shadow-xs">
                  <Building2 className="w-4 h-4 text-[#008C78] shrink-0" />
                  <span>Clinic Facilities</span>
                </div>
                <span className="text-[11px] font-extrabold text-[#008C78] bg-white px-3 py-1.5 rounded-full border border-[#008C78]/30 shadow-xs whitespace-nowrap">
                  Fee: {CLINIC_INFO.consultationFee}
                </span>
              </div>

              {/* SPORC Clinic Rawalpindi - Main Practice */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/90 border border-[#008C78]/20 shadow-xs transition-colors hover:border-[#008C78]/40 relative z-10">
                <div className="font-bold text-sm text-[#101F50] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#008C78]/15 text-[#008C78] flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span>{CLINIC_INFO.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#008C78] bg-[#EAF5F1] px-2 py-0.5 rounded-full border border-[#008C78]/20">
                    Main Practice
                  </span>
                </div>
                <p className="text-xs text-[#53616A] leading-relaxed pl-8">
                  {CLINIC_INFO.address}
                </p>
                <div className="text-[11px] text-[#008C78] font-bold pl-8 pt-1">
                  Mon - Sat: 10:00 AM – 08:00 PM
                </div>
              </div>

              {/* Consultation Timings & Rehabilitation Care Banner */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs transition-colors hover:border-slate-300 relative z-10">
                <div className="font-bold text-sm text-[#101F50] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#101F50]/10 text-[#101F50] flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Sports &amp; Orthopedic Physical Therapy</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Manual Therapy
                  </span>
                </div>
                <p className="text-xs text-[#53616A] leading-relaxed pl-8">
                  کھیلوں کی چوٹوں، مہروں اور جوڑوں کے درد کی جدید بحالی۔
                </p>
              </div>

              {/* Direct Phones - Action Buttons */}
              <div className="pt-2 border-t border-[#008C78]/15 flex flex-col sm:flex-row gap-2.5 text-xs relative z-10">
                <a
                  href={`tel:${CLINIC_INFO.phone.replace(/\s+/g, '')}`}
                  className="flex-1 min-h-[44px] p-2.5 rounded-xl bg-gradient-to-r from-[#008C78] to-[#0a9e88] hover:from-[#087C72] hover:to-[#008C78] text-white font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#008C78]/25 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{CLINIC_INFO.phone}</span>
                </a>
                <a
                  href={`tel:${(CLINIC_INFO.phone2 || '051-4903344').replace(/\s+/g, '')}`}
                  className="flex-1 min-h-[44px] p-2.5 rounded-xl bg-gradient-to-r from-[#101F50] to-[#1a2d6b] hover:from-[#0B1740] hover:to-[#101F50] text-white font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#101F50]/20 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{CLINIC_INFO.phone2 || '051-4903344'}</span>
                </a>
              </div>

              {/* Facebook Page Official Link - Rich Facebook Brand Gradient */}
              <a
                href={CLINIC_INFO.facebookPage}
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#1565C0] hover:from-[#166fe5] hover:to-[#0D47A1] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#1877F2]/25 transition-all relative z-10"
              >
                <span>Visit Official Facebook Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>

            {/* Direct Message Form with Glassmorphic Card - Elevated Modern Palette */}
            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              className="relative overflow-hidden bg-gradient-to-br from-white via-[#FAFBFD] to-[#F1F6FB] rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#101F50]/15 shadow-[0_16px_45px_rgba(16,31,80,0.06)] space-y-4"
            >
              {/* Corner Ambient Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#101F50]/5 to-transparent rounded-tr-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-3 border-b border-gray-100 relative z-10 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#008C78]/10 text-[#008C78] flex items-center justify-center shrink-0 border border-[#008C78]/20">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-[#101F50] tracking-tight">Direct Reception Inquiry</h4>
                    <span className="text-[10px] text-[#53616A]">Directly routed to {CLINIC_INFO.doctorName}'s front desk</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 whitespace-nowrap">
                  Response &lt; 2 hrs
                </span>
              </div>

              {contactSuccess ? (
                <div className="py-6 text-center space-y-3 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#008C78] flex items-center justify-center mx-auto border border-emerald-200 shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="font-extrabold text-base text-[#101F50]">Inquiry Submitted!</div>
                  <p className="text-xs text-[#53616A] max-w-xs mx-auto">
                    Your direct message has been dispatched to clinic coordination. We will reach out promptly.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="text-xs font-bold text-[#008C78] hover:underline cursor-pointer min-h-[44px] inline-flex items-center"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3 relative z-10" id="form-direct-contact">
                  {contactError && (
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                      {contactError}
                    </div>
                  )}

                  {/* Responsive grid for name and email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Your Name *"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl bg-[#F9FBFA] border border-gray-200 text-sm font-medium text-[#101F50] focus:bg-white focus:border-[#008C78] focus:ring-2 focus:ring-[#008C78]/20 focus:outline-none transition-all shadow-xs"
                      />
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="Your Email *"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl bg-[#F9FBFA] border border-gray-200 text-sm font-medium text-[#101F50] focus:border-[#008C78] focus:ring-2 focus:ring-[#008C78]/20 focus:outline-none transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="Phone / WhatsApp Number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl bg-[#F9FBFA] border border-gray-200 text-sm font-medium text-[#101F50] focus:border-[#008C78] focus:ring-2 focus:ring-[#008C78]/20 focus:outline-none transition-all shadow-xs"
                    />
                  </div>

                  <div className="relative">
                    <textarea
                      rows={3}
                      required
                      placeholder="Write your questions or notes regarding treatment..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#F9FBFA] border border-gray-200 text-sm font-medium text-[#101F50] focus:border-[#008C78] focus:ring-2 focus:ring-[#008C78]/20 focus:outline-none transition-all shadow-xs"
                    ></textarea>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3.5 min-h-[46px] rounded-full bg-gradient-to-r from-[#101F50] to-[#1a2d6b] hover:from-[#0B1740] hover:to-[#101F50] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-[#101F50]/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactLoading ? 'Transmitting Inquiry...' : 'Send Direct Message to Reception'}</span>
                  </motion.button>
                </form>
              )}
            </motion.div>

          </div>

        </div>

      </div>

      {/* Official Patient Appointment Slip / Token Pass Modal */}
      <AppointmentSlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        appointment={slipAppointment}
      />
    </section>
  );
};
export default AppointmentAndContactSection;
