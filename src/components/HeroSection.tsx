import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Star, ShieldCheck, CheckCircle2, Award, Activity } from 'lucide-react';
import { clinicImages } from '../assets';
import { CLINIC_INFO } from '../data/clinicData';

interface HeroSectionProps {
  onBookClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onBookClick, onExploreClick }) => {
  return (
    <section id="home" className="relative flex items-center overflow-hidden bg-gradient-to-b from-[#EAF5F1]/80 via-[#F1F8F5]/40 to-white pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-12 lg:pb-8">
      {/* Background Watermark Typography */}
      <div 
        aria-hidden="true" 
        className="absolute top-12 left-1/2 -translate-x-1/2 w-full text-center select-none pointer-events-none z-0 overflow-hidden"
      >
        <span className="font-['Manrope',sans-serif] font-black text-[55px] sm:text-[95px] md:text-[120px] lg:text-[150px] xl:text-[170px] tracking-tight text-[#008C78]/[0.06] uppercase whitespace-nowrap block leading-none">
          SPORC CLINIC REHAB
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headings, trust badge & actions */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left"
          >
            
            {/* Top Review Trust Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#008C78]/20 shadow-sm w-fit"
            >
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#101F50] text-white flex items-center justify-center text-[10px] font-bold">SP</div>
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#008C78] text-white flex items-center justify-center text-[10px] font-bold">RC</div>
                <div className="w-7 h-7 rounded-full border-2 border-white bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">DPT</div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                  <span className="text-[11px] font-bold text-[#101F50] ml-1">{CLINIC_INFO.satisfactionRate} Satisfaction</span>
                </div>
                <span className="text-[11px] font-semibold text-[#53616A]">Sports &amp; Orthopedic Rehabilitation • Rawalpindi</span>
              </div>
            </motion.div>

            {/* Main Editorial Headline */}
            <div className="space-y-4">
              <h1 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-5xl md:text-6xl lg:text-[64px] text-[#101F50] tracking-tight leading-[1.1]">
                Sports Physiotherapy &amp; <span className="text-[#008C78]">Orthopedic Rehab</span>
              </h1>

              {/* Mobile Doctor Card (Displayed directly below main headline on mobile for immediate visual impact) */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="block lg:hidden my-4 relative w-full max-w-sm mx-auto"
              >
                {/* Ambient halo glow */}
                <div className="absolute inset-0 bg-[#008C78]/20 rounded-3xl filter blur-2xl transform scale-95 pointer-events-none"></div>

                {/* Main Portrait Card */}
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white">
                  <img
                    src={clinicImages.drIftikharAliHero}
                    alt="Dr. Iftikhar Ali - SPORC Clinic Rawalpindi"
                    width={384}
                    height={420}
                    fetchPriority="high"
                    decoding="async"
                    className="w-full h-[360px] sm:h-[420px] object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101F50]/85 via-transparent to-transparent"></div>

                  {/* Floating Bottom Card */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg border border-white/70">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#008C78]">
                          Consultant Physiotherapist
                        </div>
                        <div className="font-extrabold text-[#101F50] text-sm sm:text-base font-['Manrope',sans-serif]">
                          {CLINIC_INFO.doctorName}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-[#53616A]">Sports &amp; Spine Rehabilitation Specialist</div>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#EAF5F1] text-[#008C78] flex items-center justify-center shrink-0 shadow-xs">
                        <Award className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Top-Right Mini Badge */}
                <div className="absolute -top-3 -right-2 sm:-right-4 bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-gray-100 flex items-center gap-2.5 z-20">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#008C78] flex items-center justify-center font-bold text-xs">
                    {CLINIC_INFO.experienceYears}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[11px] font-bold text-[#101F50]">Years Clinical</div>
                    <div className="text-[9px] text-gray-400">Experience</div>
                  </div>
                </div>
              </motion.div>

              {/* Editorial Description */}
              <p className="text-base sm:text-lg text-[#53616A] max-w-xl font-normal leading-relaxed pt-1">
                Premier rehabilitation center located opposite Benazir Bhutto Hospital on Murree Road, Rawalpindi. Led by {CLINIC_INFO.doctorName}, specializing in sports injuries, ACL recovery, non-surgical disc decompression, frozen shoulder, and joint mobility.
              </p>
            </div>

            {/* Key Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm text-[#101F50] font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Opposite Benazir Bhutto Hospital, Murree Rd</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Sports Injury, ACL &amp; Meniscus Rehab</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Non-Surgical Sciatica &amp; Spine Decompression</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Consultation Fee: {CLINIC_INFO.consultationFee}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 pt-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBookClick}
                className="w-full sm:w-auto justify-center px-8 py-4 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#008C78]/25 hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer group"
                id="btn-hero-book"
              >
                <span>Book Doctor Appointment</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onExploreClick}
                className="w-full sm:w-auto justify-center px-7 py-4 rounded-full bg-white/80 hover:bg-white text-[#101F50] font-bold text-sm sm:text-base border border-gray-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer"
                id="btn-hero-services"
              >
                Explore Rehab Treatments
              </motion.button>
            </div>

          </motion.div>

          {/* Right Column: Hero Doctor Card with 3D Depth & Floating Elements (Desktop only) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="hidden lg:flex lg:col-span-5 relative justify-center"
          >
            
            {/* Background circular glow */}
            <div className="absolute inset-0 bg-[#008C78]/15 rounded-full filter blur-3xl transform scale-90"></div>

            {/* Main Portrait Card with 3D Depth */}
            <motion.div 
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white"
            >
              <img
                src={clinicImages.drIftikharAliHero}
                alt="Dr. Iftikhar Ali - SPORC Clinic Rawalpindi"
                width={448}
                height={500}
                fetchPriority="high"
                decoding="async"
                className="w-full h-[450px] sm:h-[500px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101F50]/80 via-transparent to-transparent"></div>

              {/* Floating Bottom Card */}
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/60">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#008C78]">
                      Consultant Physiotherapist
                    </div>
                    <div className="font-extrabold text-[#101F50] text-base font-['Manrope',sans-serif]">
                      {CLINIC_INFO.doctorName}
                    </div>
                    <div className="text-[11px] text-[#53616A]">Sports &amp; Spine Rehab Specialist</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#EAF5F1] text-[#008C78] flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Top-Right Mini Badge with Float Animation */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-3 z-20"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#008C78] flex items-center justify-center font-bold text-sm">
                {CLINIC_INFO.experienceYears}
              </div>
              <div className="text-left leading-tight pr-1">
                <div className="text-xs font-extrabold text-[#101F50]">Years Clinical</div>
                <div className="text-[10px] text-gray-500">Excellence</div>
              </div>
            </motion.div>

            {/* Floating Bottom-Left Patient Count Badge */}
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-3 -left-4 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-gray-100 flex items-center gap-3 z-20"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#101F50] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#008C78]" />
              </div>
              <div className="text-left leading-tight pr-2">
                <div className="text-xs font-extrabold text-[#101F50]">{CLINIC_INFO.patientsCount}</div>
                <div className="text-[10px] text-gray-500">Recovered Patients</div>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};
export default HeroSection;
