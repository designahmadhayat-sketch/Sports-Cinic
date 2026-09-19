import React from 'react';
import { Sparkles, Phone, Mail, MapPin, Lock, ExternalLink } from 'lucide-react';
import { CLINIC_INFO, SERVICES } from '../data/clinicData';
import { clinicImages } from '../assets';

interface FooterProps {
  onOpenAdminLogin: () => void;
  onOpenBooking: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin, onOpenBooking }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#101F50] text-white pt-16 pb-12 border-t border-[#0B1740]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={clinicImages.clinicLogo}
                alt="SPORC Clinic Logo"
                width={44}
                height={44}
                className="w-11 h-11 rounded-xl object-contain bg-white p-0.5 border border-white/30 shadow-md"
              />
              <div>
                <span className="font-['Manrope',sans-serif] font-extrabold text-2xl text-white">
                  SPORC<span className="text-[#008C78]">Clinic</span>
                </span>
                <div className="text-[10px] tracking-wider uppercase font-semibold text-[#EAF5F1]/80">
                  {CLINIC_INFO.doctorName} • Sports &amp; Ortho Rehab
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              Leading sports physical therapy and orthopedic rehabilitation center in Rawalpindi. Located opposite Benazir Bhutto Hospital on Murree Road, providing advanced recovery programs for sports injuries, sciatica, arthritis, and post-surgery mobility.
            </p>

            <div className="pt-2 text-xs text-gray-300 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#008C78] shrink-0 mt-0.5" />
                <span>{CLINIC_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>{CLINIC_INFO.phone} | {CLINIC_INFO.phone2}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>{CLINIC_INFO.email}</span>
              </div>
            </div>

            {/* Official Google Maps & Facebook Link */}
            <div className="pt-1 flex flex-wrap gap-2">
              <a
                href={CLINIC_INFO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-emerald-200 transition-colors"
              >
                <span>Google Maps Location</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={CLINIC_INFO.facebookPage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-blue-200 transition-colors"
              >
                <span>Facebook Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li><button onClick={() => scrollTo('home')} className="hover:text-[#008C78] transition-colors cursor-pointer">Home</button></li>
              <li><button onClick={() => scrollTo('about')} className="hover:text-[#008C78] transition-colors cursor-pointer">About {CLINIC_INFO.doctorName}</button></li>
              <li><button onClick={() => scrollTo('services')} className="hover:text-[#008C78] transition-colors cursor-pointer">Rehab Treatments</button></li>
              <li><button onClick={() => scrollTo('reviews')} className="hover:text-[#008C78] transition-colors cursor-pointer">Patient Feedback</button></li>
              <li><button onClick={() => scrollTo('appointment')} className="hover:text-[#008C78] transition-colors cursor-pointer">Book Consultation</button></li>
            </ul>
          </div>

          {/* Col 3: Rehab Treatments */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white">Rehab Treatments</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {SERVICES.slice(0, 5).map((srv) => (
                <li key={srv.id} className="truncate">
                  <button 
                    onClick={() => scrollTo('services')} 
                    className="hover:text-[#008C78] transition-colors text-left truncate max-w-full cursor-pointer"
                  >
                    {srv.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Consultation Hours & CTA */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-white">Clinical Hours</h4>
            <div className="text-xs text-gray-300 space-y-1.5">
              <div>{CLINIC_INFO.workingHours.weekdays}</div>
              <div>{CLINIC_INFO.workingHours.weekends}</div>
              <div className="text-emerald-400 font-semibold">{CLINIC_INFO.workingHours.emergency}</div>
            </div>

            <button
              onClick={onOpenBooking}
              className="w-full py-3 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              id="btn-footer-book"
            >
              Book In-Person Consultation
            </button>
          </div>

        </div>

        {/* Bottom Bar with Admin Portal Link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            © {new Date().getFullYear()} {CLINIC_INFO.fullName}. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              id="btn-footer-admin"
            >
              <Lock className="w-3.5 h-3.5 text-[#008C78]" />
              <span>Medical Staff Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
