import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SERVICES } from '../data/clinicData';
import { FeedbackItem } from '../types';

interface LeaveFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedbackAdded: (fb: FeedbackItem) => void;
}

export const LeaveFeedbackModal: React.FC<LeaveFeedbackModalProps> = ({
  isOpen,
  onClose,
  onFeedbackAdded,
}) => {
  const [patientName, setPatientName] = useState('');
  const [category, setCategory] = useState(SERVICES[0].title);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !comment) {
      setErrorMsg('Please enter your name and comments.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const newFb = await api.submitFeedback({
        patientName,
        rating,
        category,
        comment,
      });

      onFeedbackAdded(newFb);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#008C78] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#101F50]">Thank You for Your Feedback!</h3>
            <p className="text-xs text-[#53616A]">
              Your patient experience review has been recorded and will help other individuals seeking specialized sports physical therapy and orthopedic rehabilitation in Rawalpindi.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-[#008C78] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-[#008C78]">Patient Voice</span>
              <h3 className="text-xl font-bold text-[#101F50]">Share Your Clinic Experience</h3>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#101F50] mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Bilal Hamza"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#008C78] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101F50] mb-1">Treatment Received</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#008C78] focus:outline-none bg-white"
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.title}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101F50] mb-1">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-600 ml-2">{rating} of 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101F50] mb-1">Your Review *</label>
              <textarea
                rows={3}
                required
                placeholder="Tell us about the consultation, friendliness of the doctor, cleanliness, and outcome..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#008C78] focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#008C78] hover:bg-[#087C72] text-white font-bold text-sm shadow-md transition-all"
            >
              {loading ? 'Submitting...' : 'Post Patient Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
