import React from 'react';

export const StatementSection: React.FC = () => {
  return (
    <section className="py-16 bg-[#F5F6F5] overflow-hidden select-none border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-['Manrope',sans-serif] font-black text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#101F50] tracking-tighter uppercase leading-none">
          <span>HEALING</span>
          <span className="text-[#008C78]">+</span>
          <span>CARE</span>
          <span className="text-[#008C78]">+</span>
          <span>RECOVERY</span>
        </div>
        <p className="mt-4 text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#53616A]">
          SPORC Clinic Rawalpindi • Dr. Iftikhar Ali Sports &amp; Orthopedic Rehabilitation
        </p>
      </div>
    </section>
  );
};
