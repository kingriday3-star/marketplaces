import { Review } from '../types';

const STORAGE_REVIEWS = 'marketplaces_reviews_v2';

const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-honey-1',
    productId: 'prod-honey-01',
    userName: 'আব্দুল করিম',
    userIdentifier: 'karim@gmail.com',
    rating: 5,
    comment: 'আলহামদুলিল্লাহ, মধুটা সত্যিই অসাধারণ! ঘ্রাণ এবং স্বাদ শতভাগ খাঁটি সুন্দরবনের মধুর মতো। প্যাকেজিংও খুব ভালো ছিল কাচের বোতলে।',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    verifiedPurchase: true,
    likes: 12
  },
  {
    id: 'rev-honey-2',
    productId: 'prod-honey-01',
    userName: 'তানভীর আহমেদ',
    userIdentifier: '01719882233',
    rating: 5,
    comment: 'ক্যাশ অন ডেলিভারিতে নিলাম, প্রথমে টেস্ট করে তারপর টাকা দিয়েছি। এমন বিশ্বস্ত সার্ভিস সচরাচর দেখা যায় না। ধন্যবাদ Market places টিমকে!',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    verifiedPurchase: true,
    likes: 8
  },
  {
    id: 'rev-honey-3',
    productId: 'prod-honey-01',
    userName: 'নাসরিন আক্তার',
    userIdentifier: 'nasrin.bd@gmail.com',
    rating: 4,
    comment: 'ভালো মানের মধু। বাচ্চাদের জন্য নিয়েছি, সবাই পছন্দ করেছে। ডেলিভারি ২ দিনের মধ্যে পেয়েছি।',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    verifiedPurchase: true,
    likes: 5
  },
  {
    id: 'rev-watch-1',
    productId: 'prod-watch-02',
    userName: 'সোহেল রানা',
    userIdentifier: '01822334455',
    rating: 5,
    comment: 'অ্যামোলেড ডিসপ্লে এক কথায় অসাধারণ! ব্লুটুথ কলিংয়ের সাউন্ড অনেক পরিষ্কার এবং ব্যাটারি ব্যাকআপ ৫-৬ দিন অনায়াসে চলে যায়। ফুল ভ্যালু ফর মানি।',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    verifiedPurchase: true,
    likes: 19
  },
  {
    id: 'rev-watch-2',
    productId: 'prod-watch-02',
    userName: 'Mahmudul Hasan',
    userIdentifier: 'mahmud.tech@gmail.com',
    rating: 5,
    comment: 'Premium build quality, looks very stylish on wrist. Touch response is super smooth. Highly recommended for daily wear.',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    verifiedPurchase: true,
    likes: 7
  },
  {
    id: 'rev-bag-1',
    productId: 'prod-leather-03',
    userName: 'ইঞ্জিঃ রফিকুল ইসলাম',
    userIdentifier: '01911224466',
    rating: 5,
    comment: 'খাঁটি লেদারের গন্ধ ও প্রিমিয়াম ফিনিশিং। আমার ১৫.৬ ইঞ্চি ডেল ল্যাপটপ নিখুঁতভাবে ফিট হয়েছে। সেলাই ও পিতলের চেইন খুব টেকসই।',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    verifiedPurchase: true,
    likes: 15
  },
  {
    id: 'rev-panjabi-1',
    productId: 'prod-panjabi-04',
    userName: 'ফারহান চৌধুরী',
    userIdentifier: 'farhan.bd@gmail.com',
    rating: 5,
    comment: 'সাইজ ও ফিটিং একদম পারফেক্ট। কাপড়ের মান অত্যন্ত আরামদায়ক এবং হাতের এমব্রয়ডারি কাজের ফিনিশিং চোখে পড়ার মতো। ঈদের জন্য বেস্ট চয়েস।',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    verifiedPurchase: true,
    likes: 11
  },
  {
    id: 'rev-sample-1',
    productId: 'prod-user-template',
    userName: 'কাস্টমার রিভিউয়ার',
    userIdentifier: 'demo@gmail.com',
    rating: 5,
    comment: 'দারুণ প্ল্যাটফর্ম! পণ্য দেখে সহজে অর্ডার করা যায় এবং সাথে সাথে রেটিং দেওয়া যায়।',
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
    likes: 3
  }
];

export function getAllReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_REVIEWS;
}

export function saveReviews(reviews: Review[]) {
  try {
    localStorage.setItem(STORAGE_REVIEWS, JSON.stringify(reviews));
  } catch {
    // ignore
  }
}

export function getProductReviews(productId: string): Review[] {
  const all = getAllReviews();
  return all
    .filter((r) => r.productId === productId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getProductRatingStats(productId: string): { average: number; count: number } {
  const reviews = getProductReviews(productId);
  if (reviews.length === 0) {
    return { average: 5.0, count: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Number((sum / reviews.length).toFixed(1));
  return { average: avg, count: reviews.length };
}

export function addProductReview(
  productId: string,
  userName: string,
  rating: number,
  comment: string,
  userIdentifier?: string
): Review {
  const all = getAllReviews();
  const newRev: Review = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId,
    userName: userName.trim() || 'সম্মানিত ক্রেতা',
    userIdentifier: userIdentifier?.trim(),
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
    likes: 0
  };

  const updated = [newRev, ...all];
  saveReviews(updated);
  return newRev;
}
