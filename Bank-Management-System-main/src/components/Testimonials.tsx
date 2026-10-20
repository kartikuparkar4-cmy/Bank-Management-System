import React, { useState, useEffect } from "react";
import { api } from "../lib/api";
import { FeedbackItem } from "../types";
import { Quote, Plus, Star } from "lucide-react";

interface TestimonialsProps {
  onOpenFeedbackModal: () => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ onOpenFeedbackModal }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = async () => {
    try {
      const list = await api.getFeedback();
      setFeedbacks(list);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
    window.addEventListener("feedback_updated", fetchTestimonials);
    return () => window.removeEventListener("feedback_updated", fetchTestimonials);
  }, []);

  return (
    <section className="w-full py-16 sm:py-24 px-6 sm:px-12 relative" id="clients">
      {/* Background glow */}
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-[#00f6ff]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            What People are <br />
            <span className="bg-gradient-to-r from-[#33bbcf] to-[#def9fa] bg-clip-text text-transparent">
              saying about us
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-base text-gray-400 max-w-sm">
              Everything you need to accept card payments and grow your business anywhere on the planet.
            </p>
            <button
              onClick={onOpenFeedbackModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00f6ff]/40 text-xs font-semibold text-white transition-all cursor-pointer flex-shrink-0"
              id="add-feedback-btn"
            >
              <Plus className="w-3.5 h-3.5 text-[#00f6ff]" />
              <span>Leave Feedback</span>
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {feedbacks.map((item, index) => (
            <div
              key={item.id || index}
              className="group flex flex-col justify-between p-8 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent hover:from-white/[0.07] border border-white/5 hover:border-[#00f6ff]/30 transition-all duration-300 backdrop-blur-sm shadow-xl"
              id={`testimonial-card-${index}`}
            >
              <div>
                {/* Cyan Double Quote Glyph */}
                <div className="mb-6">
                  <span className="text-4xl font-serif text-[#00f6ff] opacity-90 select-none">“</span>
                </div>

                <p className="text-sm sm:text-base text-gray-300 font-normal leading-relaxed mb-8">
                  {item.message}
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <img
                  src={
                    item.avatar ||
                    `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
                  }
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-base font-semibold text-white">{item.name}</h4>
                  <p className="text-xs text-gray-400">{item.role || "Founder & Leader"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
