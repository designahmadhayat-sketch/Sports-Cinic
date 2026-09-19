import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Calendar,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { SERVICES, CLINIC_INFO } from '../data/clinicData';
import { ClinicService } from '../types';

interface ServicesSectionProps {
  onSelectServiceForBooking: (service: ClinicService) => void;
  onOpenServiceDetails: (service: ClinicService) => void;
}

// 3D Tilt Card with dynamic specular glare and spring physics
const TiltServiceCard: React.FC<{
  service: ClinicService;
  index: number;
  onSelectServiceForBooking: (service: ClinicService) => void;
  onOpenServiceDetails: (service: ClinicService) => void;
}> = ({ service, index, onSelectServiceForBooking, onOpenServiceDetails }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Framer-motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for natural elastic response
  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 20 });

  // Map mouse positions to subtle tilt angles (-8deg to 8deg)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  // Specular glare position and opacity
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlarePos({
      x: (mouseX / width) * 100,
      y: (mouseY / height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setGlarePos(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 35, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ 
        duration: 0.55, 
        delay: Math.min(index * 0.08, 0.35),
        ease: [0.16, 1, 0.3, 1] 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group relative rounded-3xl overflow-hidden bg-white/80 hover:bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_12px_36px_rgba(0,140,120,0.08)] hover:shadow-[0_24px_50px_rgba(0,140,120,0.2)] transition-shadow duration-300 flex flex-col justify-between"
    >
      {/* Dynamic Specular Glass Glare Layer */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-3xl z-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, transparent 65%)`,
        }}
      />

      <div style={{ transform: 'translateZ(18px)' }}>
        {/* Service Visual Preview with High-Quality ENT Imagery */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
          <img
            src={service.imageUrl}
            alt={service.title}
            width={400}
            height={208}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"></div>

          {/* Glass Category Badge Over Image */}
          <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold text-[#008C78] shadow-md border border-white/80">
            {service.category}
          </div>

          {/* Procedure Duration Tag */}
          <div className="absolute bottom-3.5 right-3.5 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border border-white/20">
            <Clock className="w-3 h-3 text-[#008C78]" />
            <span>{service.estimatedDuration}</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-3">
          <h3 className="font-bold text-lg text-[#101F50] group-hover:text-[#008C78] transition-colors leading-snug font-['Manrope',sans-serif]">
            {service.title}
          </h3>

          <p className="text-xs text-[#53616A] leading-relaxed line-clamp-2">
            {service.shortDesc}
          </p>

          {/* 2 Key Clinical Points */}
          <div className="pt-2 space-y-1.5 border-t border-gray-100/80">
            {service.benefits.slice(0, 2).map((b, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2 text-[11px] text-[#101F50] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#008C78] shrink-0" />
                <span className="truncate">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Buttons */}
      <div 
        className="p-5 sm:p-6 pt-0 flex items-center justify-between gap-3 relative z-30"
        style={{ transform: 'translateZ(24px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectServiceForBooking(service)}
          className="flex-1 py-2.5 px-4 min-h-[44px] rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-xs shadow-md shadow-[#008C78]/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          id={`btn-book-service-${service.id}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Consultation</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenServiceDetails(service)}
          className="p-2.5 min-h-[44px] min-w-[44px] rounded-full bg-white/90 hover:bg-white text-[#101F50] hover:text-[#008C78] border border-gray-200/80 shadow-xs flex items-center justify-center transition-colors cursor-pointer"
          title="View Procedure Details"
          id={`btn-details-${service.id}`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </motion.button>
      </div>

    </motion.div>
  );
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onSelectServiceForBooking,
  onOpenServiceDetails,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAllMobile, setShowAllMobile] = useState<boolean>(false);

  const categories = [
    'All', 
    'Nasal & Sinus', 
    'Facial Aesthetics & Airway', 
    'Ear & Otology', 
    'Audiology & Balance', 
    'Throat & Pediatric ENT', 
    'Head & Neck'
  ];

  const filteredServices = selectedCategory === 'All' 
    ? SERVICES 
    : SERVICES.filter(s => s.category === selectedCategory);

  return (
    <section id="services" className="pt-2 pb-12 sm:pt-4 sm:pb-16 lg:pt-6 lg:pb-20 bg-gradient-to-b from-[#EAF5F1]/60 via-[#F3FAF7] to-[#EAF5F1]/40 relative overflow-hidden">
      
      {/* 3D Glass ambient lighting spheres */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 rounded-full bg-[#008C78]/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 -left-24 w-96 h-96 rounded-full bg-[#101F50]/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header with Framer-motion whileInView entrance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4"
        >
          <div className="max-w-2xl">
            <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#101F50] tracking-tight">
              Specialized programs in <span className="font-serif italic font-normal text-[#008C78]">sports &amp; orthopedic rehab</span>
            </h2>
            <p className="text-sm sm:text-base text-[#53616A] mt-2.5 leading-relaxed">
              Comprehensive rehabilitation treatments and evidence-based physical therapy provided by {CLINIC_INFO.doctorName} at {CLINIC_INFO.name}.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#101F50] bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/90 shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-[#008C78]" />
            <span>Modern Electrotherapy &amp; Manual Care</span>
          </div>
        </motion.div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-8 no-scrollbar text-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-[#008C78]" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowAllMobile(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer min-h-[36px] ${
                selectedCategory === cat
                  ? 'bg-[#008C78] text-white shadow-sm shadow-[#008C78]/25'
                  : 'bg-white/80 hover:bg-white text-[#53616A] hover:text-[#101F50] border border-gray-200/80 shadow-2xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3D Glassmorphic Services Grid with 3D Tilt Effect */}
        {/* On mobile (<md), show only 2 items unless expanded with the arrow button */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 [perspective:1200px]">
          {filteredServices.map((service, idx) => {
            // Check if card should be hidden on mobile (idx >= 2 and not showAllMobile)
            const hideOnMobile = idx >= 2 && !showAllMobile;

            return (
              <div 
                key={service.id}
                className={hideOnMobile ? 'hidden md:block' : 'block'}
              >
                <TiltServiceCard
                  service={service}
                  index={idx}
                  onSelectServiceForBooking={onSelectServiceForBooking}
                  onOpenServiceDetails={onOpenServiceDetails}
                />
              </div>
            );
          })}
        </div>

        {/* Mobile-only "See More" Button with animated arrow */}
        {filteredServices.length > 2 && (
          <div className="mt-8 flex justify-center md:hidden">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAllMobile(!showAllMobile)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-xl border border-white text-[#101F50] hover:text-[#008C78] font-extrabold text-xs shadow-md shadow-[#008C78]/10 cursor-pointer transition-all min-h-[44px]"
              id="btn-mobile-toggle-services"
            >
              <span>
                {showAllMobile 
                  ? 'Show Less Treatments' 
                  : `See More ENT Treatments (${filteredServices.length - 2} More)`}
              </span>
              <motion.div
                animate={{ rotate: showAllMobile ? 180 : 0 }}
                transition={{ duration: 0.25 }}
              >
                <ChevronDown className="w-4 h-4 text-[#008C78]" />
              </motion.div>
            </motion.button>
          </div>
        )}

      </div>
    </section>
  );
};
export default ServicesSection;
