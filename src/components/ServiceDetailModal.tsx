import React from 'react';
import { X, Check, Clock, UserCheck, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { ClinicService } from '../types';

interface ServiceDetailModalProps {
  service: ClinicService | null;
  onClose: () => void;
  onBookThisService: (service: ClinicService) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onBookThisService,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          <div>
            <span className="text-xs uppercase font-bold text-[#008C78] bg-[#EAF5F1] px-3 py-1 rounded-full">
              {service.category}
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#101F50] mt-3 font-['Manrope',sans-serif]">
              {service.title}
            </h3>
            <p className="text-sm font-semibold text-[#008C78] mt-1">
              {service.tagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 py-3 border-y border-gray-100 text-xs text-[#53616A]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#008C78]" />
              <span>Duration: <strong className="text-[#101F50]">{service.estimatedDuration}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#008C78]" />
              <span>Lead Specialist: <strong className="text-[#101F50]">{service.doctorName}</strong></span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-[#101F50]">Clinical Overview</h4>
            <p className="text-sm text-[#53616A] leading-relaxed">
              {service.fullDesc}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <h4 className="text-xs font-bold uppercase text-[#101F50]">Key Clinical Advantages &amp; Benefits</h4>
            <div className="space-y-2">
              {service.benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#101F50]">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-[#008C78] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span className="leading-snug">{b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => { onClose(); onBookThisService(service); }}
              className="px-6 py-3 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-sm shadow-md flex items-center gap-2"
            >
              <span>Book Appointment for This Service</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
