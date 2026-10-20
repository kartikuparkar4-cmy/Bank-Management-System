import React, { useState } from "react";
import { api } from "../lib/api";
import { X, Star, Sparkles, AlertCircle, CheckCircle2, Upload, Image as ImageIcon } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setPhotoFile(file);
      
      // Create preview and compress image
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set max dimensions (resize if needed)
          const maxWidth = 400;
          const maxHeight = 400;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality for JPEG)
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          setPhoto(compressedImage);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;
    setError(null);
    setLoading(true);

    try {
      // Include photo in the feedback submission (base64 encoded)
      const feedbackData: any = {
        name: name.trim(),
        message: message.trim(),
        rating,
      };

      // If photo exists, include it
      if (photo) {
        feedbackData.photo = photo;
      }

      await api.submitFeedback(feedbackData);
      setSuccess(true);
      window.dispatchEvent(new Event("feedback_updated"));
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(false);
        setMessage("");
        setPhoto(null);
        setPhotoFile(null);
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to post review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" id="feedback-modal-overlay">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e131f] border border-white/15 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(0,246,255,0.15)]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          id="feedback-modal-close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-[#00f6ff]" />
          <h3 className="text-xl font-bold text-white">Share Your Experience</h3>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Your review will be posted live to the HooBank testimonials community section.
        </p>

        {success ? (
          <div className="p-6 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-[#00f6ff] animate-bounce" />
            <h4 className="text-base font-semibold text-white">Thank You for Your Feedback!</h4>
            <p className="text-xs text-gray-300">Your review is now live on HooBank.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Your Name & Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Asha Patel, VP of Product"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all"
                id="feedback-name-input"
              />
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Profile Photo (Optional)</label>
              
              {!photo ? (
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-[#00f6ff]/50 bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">Click to upload photo</span>
                    <span className="text-[10px] text-gray-500">PNG, JPG up to 5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={photo}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-gray-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? "text-amber-400 fill-amber-400" : "text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Your Testimonial</label>
              <textarea
                required
                rows={3}
                placeholder="How has HooBank improved your payments and financial management?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#00f6ff] transition-all resize-none"
                id="feedback-message-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#00f6ff] to-[#33bbcf] text-black font-bold text-sm shadow-[0_0_20px_rgba(0,246,255,0.3)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              id="submit-feedback-btn"
            >
              {loading ? "Posting..." : "Publish Testimonial"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
