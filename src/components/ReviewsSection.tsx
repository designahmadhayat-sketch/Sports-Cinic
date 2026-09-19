import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquarePlus, Stethoscope, Quote, ChevronDown, MessageSquare, CheckCircle2 } from 'lucide-react';
import { FeedbackItem } from '../types';
import { DEFAULT_FEEDBACK } from '../data/clinicData';

interface ReviewsSectionProps {
  feedbackList: FeedbackItem[];
  onOpenLeaveFeedback: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  feedbackList,
  onOpenLeaveFeedback,
}) => {
  const [showAllReviews, setShowAllReviews] = useState<boolean>(false);

  // Use provided feedback or fallback to clinic testimonials if fewer than 4
  const displayReviews: FeedbackItem[] = feedbackList && feedbackList.length >= 4 
    ? feedbackList 
    : [...(feedbackList || []), ...DEFAULT_FEEDBACK.slice((feedbackList || []).length)];

  const INITIAL_COUNT = 4;
  const initialReviews = displayReviews.slice(0, INITIAL_COUNT);
  const remainingReviews = displayReviews.slice(INITIAL_COUNT);

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[#EAF5F1]/80 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-10 -right-10 w-80 h-80 bg-white/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#008C78]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Centered Section Header with Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-12 space-y-3"
        >
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#008C78] text-xs font-bold uppercase tracking-wider shadow-xs">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Happy Patients &bull; Genuine Reviews</span>
          </div>
          <h2 className="font-['Manrope',sans-serif] font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#101F50] tracking-tight">
            Patient Smiles &amp; <span className="text-[#008C78]">Genuine Trust</span>
          </h2>
          <p className="text-sm sm:text-base text-[#53616A]">
            Verified patient testimonials from sports injury rehabilitation, spine decompression, joint pain relief, and clinical physical therapy by Dr. Iftikhar Ali at SPORC Clinic Rawalpindi.
          </p>

          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenLeaveFeedback}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-xs shadow-md shadow-[#008C78]/20 transition-all cursor-pointer min-h-[44px]"
              id="btn-leave-review"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Leave Patient Feedback</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Vertical Column Reviews: Only 4 Appear Initially */}
        <div className="flex flex-col gap-4 sm:gap-5">
          {initialReviews.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgba(0,140,120,0.04)] hover:border-[#008C78]/30 hover:shadow-lg transition-all duration-300 space-y-3"
            >
              {/* Header: Patient Info & Rating */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#008C78]/10 text-[#008C78] font-bold text-sm flex items-center justify-center shrink-0 border border-[#008C78]/20">
                    {item.patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-[#101F50] flex items-center gap-2">
                      <span>{item.patientName}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                    <div className="text-xs text-[#008C78] font-medium">{item.category}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400 bg-amber-50/60 px-2.5 py-1 rounded-full border border-amber-100/60">
                  {[...Array(item.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>

              {/* Review Testimonial Comment */}
              <div className="flex gap-2.5 items-start">
                <Quote className="w-4 h-4 text-[#008C78]/40 shrink-0 mt-1 rotate-180" />
                <p className="text-sm sm:text-base text-[#101F50] font-medium leading-relaxed italic">
                  "{item.comment}"
                </p>
              </div>
            </motion.div>
          ))}

          {/* Remaining Reviews revealed when More Reviews Icon is clicked */}
          <AnimatePresence>
            {showAllReviews && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-4 sm:gap-5 overflow-hidden"
              >
                {remainingReviews.map((item, idx) => (
                  <motion.div
                    key={item.id || idx + INITIAL_COUNT}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgba(0,140,120,0.04)] hover:border-[#008C78]/30 hover:shadow-lg transition-all duration-300 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#008C78]/10 text-[#008C78] font-bold text-sm flex items-center justify-center shrink-0 border border-[#008C78]/20">
                          {item.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm sm:text-base text-[#101F50] flex items-center gap-2">
                            <span>{item.patientName}</span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified
                            </span>
                          </div>
                          <div className="text-xs text-[#008C78] font-medium">{item.category}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400 bg-amber-50/60 px-2.5 py-1 rounded-full border border-amber-100/60">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <Quote className="w-4 h-4 text-[#008C78]/40 shrink-0 mt-1 rotate-180" />
                      <p className="text-sm sm:text-base text-[#101F50] font-medium leading-relaxed italic">
                        "{item.comment}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* More Reviews Icon & Button Trigger */}
        {remainingReviews.length > 0 && (
          <div className="flex justify-center pt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white hover:bg-white text-[#101F50] hover:text-[#008C78] font-bold text-sm shadow-md hover:shadow-lg border border-white/90 transition-all cursor-pointer group min-h-[48px]"
              id="btn-more-reviews"
            >
              <div className="w-7 h-7 rounded-full bg-[#EAF5F1] text-[#008C78] flex items-center justify-center group-hover:bg-[#008C78] group-hover:text-white transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span>
                {showAllReviews 
                  ? 'Show Fewer Reviews' 
                  : `More Reviews (${remainingReviews.length} More)`
                }
              </span>
              <ChevronDown 
                className={`w-4 h-4 text-[#008C78] transition-transform duration-300 ${
                  showAllReviews ? 'rotate-180' : ''
                }`} 
              />
            </motion.button>
          </div>
        )}

      </div>
    </section>
  );
};
export default ReviewsSection;

