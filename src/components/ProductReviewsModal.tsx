import React, { useState } from 'react';
import { Product, Review, User } from '../types';
import { getProductReviews, addProductReview, getProductRatingStats } from '../utils/reviews';
import { toBengaliNumber, formatTaka } from '../utils/bengali';
import { SupportedLanguage, t, getProductTitle } from '../utils/i18n';
import { Star, X, ArrowLeft, MessageSquare, ThumbsUp, CheckCircle2, User as UserIcon, Send, Sparkles } from 'lucide-react';

interface ProductReviewsModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onReviewAdded?: () => void;
  language?: SupportedLanguage;
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  product,
  isOpen,
  onClose,
  currentUser,
  onReviewAdded,
  language = 'bn'
}) => {
  const [reviews, setReviews] = useState<Review[]>(() => getProductReviews(product.id));
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const stats = getProductRatingStats(product.id);

  const ratingDescriptions: Record<number, string> = {
    1: language === 'bn' ? '১ স্টার - একেবারেই ভালো নয়' : '1 Star - Very Poor',
    2: language === 'bn' ? '২ স্টার - মোটামুটি ধরনের' : '2 Stars - Fair',
    3: language === 'bn' ? '৩ স্টার - ভালো মান' : '3 Stars - Good',
    4: language === 'bn' ? '৪ স্টার - খুবই ভালো ও সন্তোষজনক' : '4 Stars - Very Good',
    5: language === 'bn' ? '৫ স্টার - অসাধারণ ও সেরা কোয়ালিটি!' : '5 Stars - Outstanding & Best Quality!'
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    const nameToUse = reviewerName.trim() || currentUser?.name || 'সম্মানিত ক্রেতা';
    const newRev = addProductReview(
      product.id,
      nameToUse,
      rating,
      comment,
      currentUser?.identifier
    );

    setTimeout(() => {
      setReviews([newRev, ...reviews]);
      setComment('');
      setIsSubmitting(false);
      setSubmitSuccess(true);
      if (onReviewAdded) onReviewAdded();
      setTimeout(() => setSubmitSuccess(false), 3000);
    }, 300);
  };

  const handleToggleLike = (reviewId: string) => {
    setLikedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 transition-colors">
        
        {/* Modal Top Header with Back button */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title="পেছনে যান"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 shrink-0 border border-white/20">
              <img src={product.image} alt={getProductTitle(product, language)} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base line-clamp-1">
                {getProductTitle(product, language)}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold flex items-center">
                  ★ {stats.average}
                </span>
                <span>·</span>
                <span>{toBengaliNumber(reviews.length)} টি গ্রাহক রিভিউ</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6">
          
          {/* Rating Summary Card */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-extrabold text-amber-500">
                {stats.average}
              </div>
              <div>
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.average) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  সর্বমোট {toBengaliNumber(reviews.length)} জন ক্রেতা রেটিং দিয়েছেন
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-amber-500/20 text-center sm:text-right">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 justify-center sm:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ১০০% ভেরিফাইড ক্রেতার মতামত
              </span>
              <span>পণ্য যাচাই করে মতামত প্রকাশ করুন</span>
            </div>
          </div>

          {/* Write a 5-Star Review Form */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>আপনার ৫-স্টার রেটিং ও মতামত দিন</span>
            </h4>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>আপনার মূল্যবান রিভিউটি সফলভাবে জমা হয়েছে! ধন্যবাদ।</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  রেটিং নির্বাচন করুন (১ থেকে ৫ স্টার):
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform"
                        title={`${star} স্টার`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800/50">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* Reviewer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>আপনার নাম</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মোঃ সাকিব হাসান"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Comment Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>পণ্যের গুণগত মান ও আপনার অভিজ্ঞতা <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="পণ্যটির মান কেমন ছিল? ডেলিভারি ও প্যাকেজিং কেমন ছিল? আপনার মতামত বিস্তারিত লিখুন..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'জমা হচ্ছে...' : 'রিভিউ সাবমিট করুন'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>ক্রেতাদের সকল মতামত ({toBengaliNumber(reviews.length)})</span>
              <span className="text-xs text-slate-400 font-normal">সর্বশেষ রিভিউ প্রথমে</span>
            </h4>

            {reviews.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                <p className="text-xs">এখনও কোনো রিভিউ যুক্ত করা হয়নি। আপনিই প্রথম রিভিউ দিন!</p>
              </div>
            ) : (
              reviews.map((rev) => {
                const isLiked = likedReviews[rev.id];
                const likeCount = (rev.likes || 0) + (isLiked ? 1 : 0);

                return (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
                          {rev.userName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {rev.userName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                ভেরিফাইড
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('bn-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-400 gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-10">
                      {rev.comment}
                    </p>

                    <div className="flex items-center justify-end gap-3 pt-1 text-[11px] text-slate-400">
                      <button
                        onClick={() => handleToggleLike(rev.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                          isLiked
                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                            : 'hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                        <span>উপকারী ({toBengaliNumber(likeCount)})</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {product.category} · {formatTaka(product.price)}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
