import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  Bone,
  Flame,
  Clock
} from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';
import { clinicImages } from '../assets';

interface AboutSectionProps {
  onLearnMoreClick: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onLearnMoreClick }) => {
  // 3D Card tilt state
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Smooth 3D tilt calculation (-10 to 10 deg)
    const rotX = -((y - centerY) / centerY) * 10;
    const rotY = ((x - centerX) / centerX) * 10;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <section id="about" className="py-20 lg:py-28 bg-gradient-to-b from-white via-[#F8FCFA] to-white relative overflow-hidden">
      
      {/* 3D Ambient blurred spheres */}
      <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full bg-[#008C78]/10 blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#101F50]/5 blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Interactive 3D Perspective Card with Layered Floating Elements */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex justify-center"
          >
            <div
              className="relative w-full max-w-md sm:max-w-lg cursor-pointer"
              style={{ perspective: '1100px' }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
            >
              {/* Main 3D Tilting Stage */}
              <div
                className="relative rounded-3xl overflow-visible p-2.5 bg-gradient-to-br from-white/90 via-white/70 to-[#EAF5F1]/80 backdrop-blur-2xl border border-white/90 shadow-[0_24px_60px_rgba(0,140,120,0.16)] transition-transform duration-200 ease-out"
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Visual Clinic & Doctor Stage Container */}
                <div className="relative rounded-2xl overflow-hidden h-[390px] sm:h-[440px] bg-gradient-to-br from-[#101F50] via-[#0F3642] to-[#008C78] shadow-inner flex flex-col justify-between p-6 text-white">
                  
                  {/* Subtle Background Abstract Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                  {/* Layered Glass Pill: Sports & Ortho Center (Top Left) */}
                  <div 
                    className="relative z-10 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-emerald-200 text-xs font-black shadow-md flex items-center gap-1.5 w-fit"
                    style={{ transform: 'translateZ(35px)' }}
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-300" />
                    <span>کھیلوں کی چوٹوں اور مہروں کی جدید بحالی</span>
                  </div>

                  {/* Visual Centerpiece */}
                  <div className="relative z-10 my-auto text-center space-y-3">
                    <div className="w-24 h-24 mx-auto rounded-3xl bg-white border-2 border-white/40 flex items-center justify-center shadow-2xl p-2.5 overflow-hidden">
                      <img
                        src={clinicImages.clinicLogo}
                        alt="SPORC Clinic Logo"
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-black tracking-wide text-white">SPORC Clinic Rawalpindi</div>
                      <p className="text-xs text-emerald-100/80 max-w-xs mx-auto">
                        Sports &amp; Orthopedic Rehabilitation Center
                      </p>
                    </div>
                  </div>

                  {/* Doctor Info Card Floating at Bottom */}
                  <div 
                    className="relative z-10 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/90 text-[#101F50] shadow-xl flex items-center justify-between"
                    style={{ transform: 'translateZ(40px)' }}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-[#008C78] uppercase tracking-wider">
                        Sports &amp; Orthopedic Rehabilitation
                      </div>
                      <div className="font-extrabold text-base sm:text-lg font-['Manrope',sans-serif]">
                        {CLINIC_INFO.doctorName}
                      </div>
                      <div className="text-[11px] text-[#53616A] font-medium">
                        SPORC Clinic • Opposite Benazir Bhutto Hospital, Rawalpindi
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#008C78] to-[#087C72] text-white flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Layer 2: Floating 3D Badge (Top Right) */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 sm:-top-5 sm:-right-5 bg-gradient-to-br from-[#101F50] to-[#0B1740] text-white rounded-2xl p-4 shadow-2xl border border-white/30 flex items-center gap-3"
                  style={{ transform: 'translateZ(55px)' }}
                >
                  <div className="w-9 h-9 rounded-xl bg-[#008C78] flex items-center justify-center text-white shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-base font-black font-['Manrope',sans-serif] leading-none text-emerald-300">
                      4.8 ★
                    </div>
                    <div className="text-[10px] text-white/80 font-semibold mt-1">
                      Google Maps Rating
                    </div>
                  </div>
                </motion.div>

                {/* Layer 3: Floating 3D Micro-Pill (Bottom Left) */}
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="hidden sm:flex absolute -bottom-3 -left-3 px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white text-[#101F50] shadow-xl items-center gap-2"
                  style={{ transform: 'translateZ(45px)' }}
                >
                  <Activity className="w-4 h-4 text-[#008C78]" />
                  <span className="text-xs font-extrabold font-['Manrope',sans-serif]">Evidence-Based Rehab</span>
                </motion.div>

              </div>
            </div>
          </motion.div>

          {/* Right Column: Medical Expertise */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 flex flex-col space-y-6 text-left"
          >
            
            {/* Pill Tag */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EAF5F1] text-[#008C78] text-xs font-extrabold uppercase tracking-widest w-fit border border-[#008C78]/20 shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#008C78] animate-pulse"></span>
              <span>Rehabilitation Specialist Profile</span>
            </motion.div>

            {/* Headline */}
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#101F50] tracking-tight leading-tight"
            >
              Clinical excellence in <span className="font-serif italic font-normal text-[#008C78]">sports injuries &amp; orthopedic rehab</span>
            </motion.h2>

            {/* Overview */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-sm sm:text-base text-[#53616A] leading-relaxed"
            >
              {CLINIC_INFO.doctorName} leads SPORC Clinic (Sports &amp; Orthopedic Rehabilitation Center) Rawalpindi, located opposite Benazir Bhutto Hospital on Murree Road. The center is dedicated to evidence-based physical therapy, manual spine mobilization, non-surgical disc decompression, and specialized athletic injury rehabilitation.
            </motion.p>

            {/* Highlights Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1"
            >
              
              {/* Card 1 */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#008C78]/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF5F1] text-[#008C78] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#101F50]">Sports Injuries</div>
                <div className="text-[11px] text-[#53616A] mt-0.5">ACL tears, sprains, muscle strains &amp; athlete rehab</div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#008C78]/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF5F1] text-[#008C78] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Bone className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#101F50]">Spine &amp; Sciatica</div>
                <div className="text-[11px] text-[#53616A] mt-0.5">Slip disc, lower back pain, sciatica &amp; cervical relief</div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-[#008C78]/40 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EAF5F1] text-[#008C78] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-[#101F50]">Joint &amp; Post-Op</div>
                <div className="text-[11px] text-[#53616A] mt-0.5">Frozen shoulder, knee arthritis &amp; post-surgery mobility</div>
              </motion.div>

            </motion.div>

            {/* Verified Credentials List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center gap-2.5 text-xs text-[#101F50] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Specialist in Sports Physical Therapy &amp; Musculoskeletal Rehabilitation</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#101F50] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Clinical Timings: Monday to Saturday, 10:00 AM – 08:00 PM</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#101F50] font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#008C78] shrink-0" />
                <span>Prime location: Opposite Benazir Bhutto Hospital, Murree Road, Rawalpindi</span>
              </div>
            </motion.div>

            {/* Action CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="pt-3"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onLearnMoreClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#101F50] hover:bg-[#0B1740] text-white font-bold text-xs shadow-lg shadow-[#101F50]/20 transition-all cursor-pointer group"
                id="btn-about-book"
              >
                <span>Schedule Consultation with {CLINIC_INFO.doctorName}</span>
                <ArrowUpRight className="w-4 h-4 text-[#008C78] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </motion.button>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};
export default AboutSection;
