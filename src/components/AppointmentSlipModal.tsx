import React from 'react';
import { Printer, Calendar, Clock, MapPin, Phone, CheckCircle2, X, Download, Share2, FileText, AlertCircle } from 'lucide-react';
import { clinicImages } from '../assets';
import { CLINIC_INFO } from '../data/clinicData';
import { Appointment } from '../types';

interface AppointmentSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const AppointmentSlipModal: React.FC<AppointmentSlipModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  if (!isOpen || !appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = encodeURIComponent(
    `*CLINIC APPOINTMENT CONFIRMATION*\n` +
    `${CLINIC_INFO.name} - ${CLINIC_INFO.doctorName} (Sports & Orthopedic Rehab)\n\n` +
    `• Ref No: #${appointment.id}\n` +
    `• Patient: ${appointment.fullName}\n` +
    `• Phone: ${appointment.phone}\n` +
    `• Service: ${appointment.appointmentType}\n` +
    `• Schedule: ${appointment.preferredDate} at ${appointment.preferredTime}\n` +
    `• Status: ${appointment.status}\n` +
    `• Fee: ${CLINIC_INFO.consultationFee}\n` +
    `• Clinic: ${CLINIC_INFO.address}\n\n` +
    `Please arrive 10-15 minutes before your scheduled slot.`
  );

  const whatsappUrl = `https://api.whatsapp.com/send?phone=923005100088&text=${whatsappMessage}`;

  // Google Calendar link generator
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Rehab Consultation: ${CLINIC_INFO.doctorName} (${appointment.appointmentType})`);
    const details = encodeURIComponent(
      `Appointment Ref: #${appointment.id}\nPatient: ${appointment.fullName}\nFee: ${CLINIC_INFO.consultationFee}\nPhone: ${CLINIC_INFO.phone}`
    );
    const location = encodeURIComponent(CLINIC_INFO.address);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-6">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#008C78] to-[#101F50] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="font-bold text-sm">Official Patient Appointment Slip</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Print slip"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Slip Content */}
        <div className="p-6 sm:p-8 space-y-6 text-[#1A261E]" id="printable-appointment-slip">
          
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-[#008C78]/30 pb-4">
            <div className="flex items-center gap-3">
              <img
                src={clinicImages.clinicLogo}
                alt="SPORC Clinic Logo"
                width={48}
                height={48}
                className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-200 p-0.5 shadow-xs"
              />
              <div>
                <h3 className="font-extrabold text-lg sm:text-xl text-[#101F50] leading-tight">
                  {CLINIC_INFO.name}
                </h3>
                <p className="text-xs font-bold text-[#008C78]">
                  {CLINIC_INFO.doctorName} • Sports &amp; Orthopedic Rehabilitation Specialist
                </p>
                <p className="text-[11px] text-gray-500">
                  Opposite Benazir Bhutto Hospital, Murree Road, Rawalpindi
                </p>
              </div>
            </div>

            {/* Token Badge */}
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">Token Ref</span>
              <span className="font-mono font-extrabold text-base sm:text-lg text-[#008C78] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block mt-0.5">
                #{appointment.id}
              </span>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#008C78] animate-pulse"></span>
              <span className="font-bold text-[#14422B]">Status: {appointment.status}</span>
            </div>
            <span className="text-gray-500 text-[11px]">
              Booked: {new Date(appointment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Patient and Appointment Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px] block">Patient Information</span>
              <div className="font-bold text-sm text-[#1A261E]">{appointment.fullName}</div>
              <div className="text-gray-600 flex items-center gap-1.5 pt-1">
                <Phone className="w-3 h-3 text-[#008C78]" />
                {appointment.phone}
              </div>
              <div className="text-gray-600 truncate">{appointment.email}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
              <span className="text-gray-400 font-bold uppercase text-[10px] block">Consultation Schedule</span>
              <div className="font-bold text-sm text-[#008C78] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {appointment.preferredDate}
              </div>
              <div className="text-gray-600 font-semibold flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                Time Slot: {appointment.preferredTime}
              </div>
              <div className="text-[11px] text-gray-500 font-medium">
                Fee: {CLINIC_INFO.consultationFee}
              </div>
            </div>
          </div>

          {/* Procedure */}
          <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 text-xs flex justify-between items-center">
            <div>
              <span className="text-gray-400 uppercase font-bold text-[10px] block">Rehabilitation Service</span>
              <span className="font-bold text-sm text-[#101F50]">{appointment.appointmentType}</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#008C78] text-white font-bold text-[11px]">
              Clinical Rehabilitation OPD
            </span>
          </div>

          {/* Patient Attached Files (if any) */}
          {appointment.attachments && appointment.attachments.length > 0 && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-2">
              <span className="text-gray-400 uppercase font-bold text-[10px] flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#008C78]" />
                Attached Reference Medical Reports / X-Rays ({appointment.attachments.length}):
              </span>
              <div className="space-y-1">
                {appointment.attachments.map((file, i) => (
                  <div key={i} className="flex items-center justify-between text-gray-700 bg-white p-2 rounded-lg border border-gray-200/80">
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinic Address & Reception Directions */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1.5">
            <span className="text-gray-400 uppercase font-bold text-[10px] block">Clinic Reception Address</span>
            <div className="font-semibold text-gray-800 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-[#008C78] shrink-0 mt-0.5" />
              <span>{CLINIC_INFO.address}</span>
            </div>
            <p className="text-[11px] text-gray-500 pl-5">
              Helpline: {CLINIC_INFO.phone} • Clinic Desk: {CLINIC_INFO.phone2 || '051-4903344'}
            </p>
          </div>

          {/* Guidelines */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Important Instructions for Patients:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-1 text-[11px]">
              <li>Please arrive 10-15 minutes before your scheduled physical therapy slot.</li>
              <li>Present this confirmation slip (or reference number #{appointment.id}) at reception.</li>
              <li>Wear comfortable clothing allowing assessment of the spine, knees, or shoulders.</li>
              <li>Bring previous MRI, X-rays, or orthopedic surgical discharge summaries.</li>
            </ul>
          </div>
        </div>

        {/* Modal Bottom Actions (Hidden on print) */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </a>

            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition-all shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#008C78]" />
              <span>Add to Calendar</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008C78] hover:bg-[#087C72] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
