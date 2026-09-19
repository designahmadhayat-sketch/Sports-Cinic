import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Award, ShieldCheck, Star } from 'lucide-react';
import { clinicImages } from '../assets';
import { CLINIC_INFO } from '../data/clinicData';

interface FeaturedDoctorSectionProps {
  onBookClick: () => void;
}

export const FeaturedDoctorSection: React.FC<FeaturedDoctorSectionProps> = ({ onBookClick }) => {
  return (
    <section id="about" className="relative py-24 bg-[#0B1740] text-white overflow-hidden">
      {/* Background soft ambient image */}
      <div className="absolute inset-0 z-0 opacity-15 mix-blend-luminosity pointer-events-none">
        <img
          src={clinicImages.clinicEnvironment}
          alt="SPORC Clinic Rehabilitation Suite"
          width={1200}
          height={600}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Doctor Profile Narrative */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#008C78]/30 border border-[#008C78]/50 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Lead Consultant Physiotherapist</span>
            </div>

            <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              Clinical Excellence by <br />
              <span className="text-[#008C78]">{CLINIC_INFO.doctorName}</span>
            </h2>

            {/* Mobile Doctor Card (Placed right below heading on mobile for immediate visual impact) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="block lg:hidden my-4 relative w-full max-w-sm mx-auto"
            >
              {/* Deep Emerald Ambient Glow */}
              <div className="absolute inset-0 bg-[#008C78]/30 rounded-3xl filter blur-2xl transform scale-95 pointer-events-none"></div>

              {/* Glass & Image Card Frame */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#101F50]/80">
                <img
                  src={clinicImages.drIftikharAliAbout}
                  alt={CLINIC_INFO.doctorName}
                  width={384}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-[360px] sm:h-[400px] object-cover object-center filter brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1740] via-[#0B1740]/25 to-transparent"></div>

                {/* Floating Bottom Card */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-[#101F50]/90 backdrop-blur-md border border-white/15 shadow-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{CLINIC_INFO.name}</div>
                      <div className="text-xs sm:text-sm font-bold text-white">Opp. Benazir Bhutto Hospital, Murree Rd</div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#008C78] text-white shrink-0 shadow-xs">
                      Sports &amp; Rehab
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Narrative Description */}
            <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              Specializing in orthopedic rehabilitation, sports injury recovery, sciatica, and spine decompression (کھیلوں کی چوٹوں، مہروں اور جوڑوں کے درد کے ماہر). Delivering modern, hands-on physical therapy and therapeutic exercise protocols to patients across Rawalpindi and Islamabad.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div>
                <div className="text-3xl font-extrabold text-[#008C78]">{CLINIC_INFO.experienceYears}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Specialist Practice</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#008C78]">{CLINIC_INFO.satisfactionRate}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Positive Feedback</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-[#008C78]">{CLINIC_INFO.patientsCount}</div>
                <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Patients Rehabilitated</div>
              </div>
            </div>

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBookClick}
                className="w-full sm:w-auto justify-center inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-semibold text-sm shadow-xl shadow-[#008C78]/30 transition-all cursor-pointer"
                id="btn-lead-doctor-book"
              >
                <span>Schedule Consultation with {CLINIC_INFO.doctorName}</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Right Column: Doctor Portrait in Clinical Setting (Desktop only) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="hidden lg:block lg:col-span-5 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
              <img
                src={clinicImages.drIftikharAliAbout}
                alt={CLINIC_INFO.doctorName}
                width={450}
                height={450}
                loading="lazy"
                decoding="async"
                className="w-full h-[450px] object-cover object-center filter brightness-105 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1740] via-transparent to-transparent"></div>

              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#101F50]/90 backdrop-blur-md border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-emerald-400 font-bold uppercase">{CLINIC_INFO.name}</div>
                    <div className="text-sm font-bold text-white">Opp. Benazir Bhutto Hospital, Rawalpindi</div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#008C78] text-white">
                    Rehab Specialist
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
export default FeaturedDoctorSection;
