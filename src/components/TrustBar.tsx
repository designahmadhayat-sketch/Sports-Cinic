import React from 'react';
import { Shield, Zap, UserCheck, Clock, Heart, Award, Activity } from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';

export const TrustBar: React.FC = () => {
  const indicators = [
    { icon: Activity, title: 'Sports Injury & Physical Rehabilitation' },
    { icon: Zap, title: 'Spine & Sciatica Decompression' },
    { icon: UserCheck, title: `${CLINIC_INFO.doctorName} (Sports & Ortho Specialist)` },
    { icon: Clock, title: 'Mon - Sat: 10:00 AM – 8:00 PM' },
    { icon: Heart, title: '4.8 ★ Google Rating (40+ Reviews)' },
    { icon: Award, title: `${CLINIC_INFO.name} - Rawalpindi` },
    { icon: Shield, title: 'Knee, Shoulder & Post-Surgery Recovery' },
  ];

  return (
    <section className="bg-[#101F50] text-white py-4 overflow-hidden border-y border-[#0B1740]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 overflow-x-auto no-scrollbar py-1">
          {indicators.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center gap-2.5 shrink-0 whitespace-nowrap group"
              >
                <div className="w-6 h-6 rounded-full bg-[#008C78]/20 flex items-center justify-center text-[#008C78] group-hover:bg-[#008C78] group-hover:text-white transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold tracking-wide text-gray-100 group-hover:text-white transition-colors">
                  {item.title}
                </span>
                {idx < indicators.length - 1 && (
                  <span className="text-white/20 ml-5 select-none hidden md:inline">•</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
