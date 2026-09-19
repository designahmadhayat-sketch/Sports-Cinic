import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, ArrowUpRight, CheckCircle, Clock, X } from 'lucide-react';
import { CASE_STUDIES, CLINIC_INFO } from '../data/clinicData';
import { CaseStudy } from '../types';
import { clinicImages } from '../assets';

interface CaseStudiesSectionProps {
  onSelectCase: (cs: CaseStudy) => void;
}

export const CaseStudiesSection: React.FC<CaseStudiesSectionProps> = ({ onSelectCase }) => {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  const handleOpen = (cs: CaseStudy) => {
    setSelectedCase(cs);
    onSelectCase(cs);
  };

  return (
    <section id="case-studies" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#008C78]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Heading with Stethoscope Icon */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-3"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF5F1] text-[#008C78] text-xs font-bold uppercase tracking-wider">
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Data + Case Studies</span>
          </div>
          <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#101F50] tracking-tight">
            Real Transformations, <span className="text-[#008C78]">Proven Care</span>
          </h2>
          <p className="text-base text-[#53616A]">
            Explore documented rehabilitation outcomes, manual therapy recovery, and orthopedic care delivered by {CLINIC_INFO.doctorName} at {CLINIC_INFO.name}, Rawalpindi.
          </p>
        </motion.div>

        {/* 4-Card Case Studies Grid with motion animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CASE_STUDIES.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { type: "spring", stiffness: 350, damping: 22 }
              }}
              className="group bg-white rounded-3xl border border-gray-100 hover:border-[#008C78]/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
              onClick={() => handleOpen(item)}
            >
              {/* Image banner */}
              <div className="relative h-44 overflow-hidden bg-gray-50">
                <img
                  src={
                    idx === 0 ? clinicImages.entRhinoplastySinus :
                    idx === 1 ? clinicImages.entEarHearingCare :
                    clinicImages.entThroatConsult
                  }
                  alt={item.title}
                  width={360}
                  height={176}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-[#008C78] shadow-xs">
                  {item.category}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#53616A]">
                    <Clock className="w-3.5 h-3.5 text-[#008C78]" />
                    <span>{item.duration}</span>
                  </div>
                  <h3 className="font-bold text-base text-[#101F50] group-hover:text-[#008C78] transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#53616A] line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 2).map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-[#EAF5F1]/80 text-[#008C78] font-medium px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#EAF5F1] text-[#008C78] group-hover:bg-[#008C78] group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Case Study Detail Modal with AnimatePresence */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100"
            >
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div>
                  <span className="text-xs uppercase font-bold text-[#008C78]">{selectedCase.category}</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#101F50] mt-1">{selectedCase.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-5 space-y-4">
                <div className="rounded-xl overflow-hidden border border-gray-100 h-48 bg-slate-100">
                  <img
                    src={clinicImages.entRhinoplastySinus}
                    alt={selectedCase.title}
                    width={500}
                    height={192}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-xs uppercase font-bold text-[#101F50]">Treatment Protocol</h4>
                  <p className="text-sm font-semibold text-[#008C78]">{selectedCase.treatmentType}</p>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-bold text-[#101F50]">Clinical Notes &amp; Outcome</h4>
                  <p className="text-sm text-[#53616A] leading-relaxed">{selectedCase.summary}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Procedure successfully completed with normal anatomy restoration and uneventful recovery.</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-5 py-2.5 rounded-full bg-[#101F50] text-white text-sm font-semibold hover:bg-[#0B1740] transition-colors cursor-pointer"
                >
                  Close Case
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
export default CaseStudiesSection;
