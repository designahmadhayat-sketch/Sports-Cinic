import React from 'react';
import { PhoneCall, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';

export const EmergencySection: React.FC = () => {
  return (
    <section id="emergency" className="py-16 bg-[#101F50] text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0B1740] to-[#101F50] rounded-3xl p-8 sm:p-12 border border-white/10 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Urgent Sports Injury &amp; Spine Trauma Care</span>
            </div>

            <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Immediate Support for Acute Musculoskeletal &amp; Sports Injuries
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Acute ligament tears, joint dislocations, severe lumbar disc herniation, debilitating sciatica nerve shooting pain, or post-surgical stiffness? SPORC Clinic provides rapid clinical physical therapy evaluations opposite Benazir Bhutto Hospital on Murree Road, Rawalpindi.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#008C78]" />
                <span>Mon - Sat: 10:00 AM – 08:00 PM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#008C78]" />
                <span>Opposite Benazir Bhutto Hospital, Murree Road, Rawalpindi</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-auto shrink-0">
            <a
              href={`tel:${CLINIC_INFO.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-base shadow-lg shadow-red-600/30 hover:shadow-xl transition-all"
              id="btn-emergency-call"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>Call Helpline: {CLINIC_INFO.phone}</span>
            </a>

            <a
              href={`tel:${CLINIC_INFO.phone2.replace(/\s+/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all text-center"
              id="btn-landline-call"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Clinic Desk: {CLINIC_INFO.phone2}</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};
export default EmergencySection;
