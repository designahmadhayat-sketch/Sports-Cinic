import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, X, AlertCircle, Trash2, CheckCircle2, RefreshCw, Printer, Paperclip } from 'lucide-react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { AppointmentSlipModal } from './AppointmentSlipModal';

interface UserAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onOpenBooking: () => void;
}

export const UserAppointmentsModal: React.FC<UserAppointmentsModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  onOpenBooking,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedSlip, setSelectedSlip] = useState<Appointment | null>(null);
  const [cancelConfirmApt, setCancelConfirmApt] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const loadAppointments = async (overrideQuery?: string) => {
    setLoading(true);
    setActionError('');
    try {
      const list = await api.getUserAppointments();
      let merged = [...list];

      // Also try auto-lookup if user has stored phone or email from recent booking
      const lastPhone = localStorage.getItem('dr_waqas_last_phone');
      const lastEmail = localStorage.getItem('dr_waqas_last_email');
      const lastAptId = localStorage.getItem('dr_waqas_last_apt_id');
      const q = overrideQuery !== undefined ? overrideQuery : (searchQuery || lastPhone || lastEmail || lastAptId || '');

      if (q.trim()) {
        try {
          const lookedUp = await api.lookupAppointments(q.trim());
          const ids = new Set(merged.map(a => a.id));
          for (const item of lookedUp) {
            if (!ids.has(item.id)) {
              merged.push(item);
              ids.add(item.id);
            }
          }
        } catch {
          // ignore lookup error
        }
      }

      // If userEmail filter is explicitly requested by authenticated user
      if (userEmail) {
        merged = merged.filter(a => a.email && a.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
      }

      setAppointments(merged);
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadAppointments('');
      return;
    }
    setSearching(true);
    setActionError('');
    try {
      const results = await api.lookupAppointments(searchQuery.trim());
      setAppointments(results);
      if (results.length === 0) {
        setActionError(`No appointments found for "${searchQuery}". Please check your Phone number or Ref ID.`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Lookup failed');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAppointments();
    }
  }, [isOpen]);

  const handleCancel = async (id: string) => {
    try {
      setActionLoading(true);
      const ok = await api.cancelUserAppointment(id);
      if (ok) {
        setAppointments(prev =>
          prev.map(a => (a.id === id ? { ...a, status: 'Cancelled' as const } : a))
        );
        setCancelConfirmApt(null);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between pb-4 border-b border-gray-100 pr-10">
          <div>
            <span className="text-xs uppercase font-bold text-[#008C78]">Patient Portal</span>
            <h3 className="text-2xl font-bold text-[#101F50]">My Appointments</h3>
            <p className="text-xs text-[#53616A]">{userEmail}</p>
          </div>
          <button
            onClick={() => loadAppointments()}
            disabled={loading}
            className="p-2 rounded-xl text-[#008C78] hover:bg-[#EAF5F1] transition-colors cursor-pointer"
            title="Refresh appointments"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Phone or Ref # Lookup for Cross-Device Access */}
        <form onSubmit={handleManualSearch} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Enter Phone # or Ref # (e.g. 03094785847 or APT-1002)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl text-xs border border-gray-200 focus:outline-none focus:border-[#008C78] focus:ring-1 focus:ring-[#008C78]"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-3.5 py-2 rounded-xl bg-[#101F50] hover:bg-[#1A3275] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {searching ? 'Finding...' : 'Find on Any Device'}
          </button>
        </form>

        {actionError && (
          <div className="my-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs">
            {actionError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading your real appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">You currently have no scheduled appointments.</p>
              <button
                onClick={() => { onClose(); onOpenBooking(); }}
                className="px-5 py-2 rounded-full bg-[#008C78] text-white text-xs font-bold shadow-sm"
              >
                Schedule First Appointment
              </button>
            </div>
          ) : (
            appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-5 rounded-2xl border border-gray-100 hover:border-[#008C78]/30 transition-all bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-gray-400 font-bold">#{apt.id}</span>
                    <h4 className="font-bold text-base text-[#101F50]">{apt.appointmentType}</h4>
                    <p className="text-xs text-[#008C78] font-semibold">{apt.doctor}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
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

                <div className="grid grid-cols-2 gap-2 text-xs text-[#53616A] bg-gray-50 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#008C78]" />
                    <span>{apt.preferredDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#008C78]" />
                    <span>{apt.preferredTime}</span>
                  </div>
                </div>

                {apt.attachments && apt.attachments.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-[#008C78] font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{apt.attachments.length} reference document(s) attached</span>
                  </div>
                )}

                {apt.message && (
                  <p className="text-xs text-gray-500 italic">
                    Notes: "{apt.message}"
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedSlip(apt)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#008C78] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Official Slip</span>
                  </button>

                  {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                    <button
                      onClick={() => setCancelConfirmApt(apt)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel Appointment</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => { onClose(); onOpenBooking(); }}
            className="px-4 py-2 rounded-full bg-[#008C78] text-white text-xs font-bold cursor-pointer"
          >
            + Book Another Visit
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Cancellation Confirmation Dialog */}
      {cancelConfirmApt && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#101F50]">Cancel Appointment</h3>
                <p className="text-xs text-gray-500">Ref #{cancelConfirmApt.id}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to cancel your consultation for <span className="font-semibold text-gray-800">{cancelConfirmApt.appointmentType}</span> on <span className="font-semibold text-gray-800">{cancelConfirmApt.preferredDate}</span>?
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelConfirmApt(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleCancel(cancelConfirmApt.id)}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AppointmentSlipModal
        isOpen={Boolean(selectedSlip)}
        onClose={() => setSelectedSlip(null)}
        appointment={selectedSlip}
      />
    </div>
  );
};
