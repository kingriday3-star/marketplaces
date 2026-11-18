import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Camera, Check, ChevronRight, Gift, Flame } from 'lucide-react';
import { SupportedLanguage, resolveBaseLang, t } from '../utils/i18n';

interface TemuCategoriesViewProps {
  products: Product[];
  onSelectCategory: (category: string) => void;
  onOpenSearch: () => void;
  language?: SupportedLanguage;
}

interface SubCategoryItem {
  id: string;
  name: string;
  nameBn: string;
  nameAr: string;
  image: string;
  isHot?: boolean;
  filterCategory: string;
}

const SIDEBAR_CATEGORIES = [
  { id: 'featured', name: 'Featured', nameBn: 'ফিচার্ড', nameAr: 'المميزة' },
  { id: 'home', name: 'Home & Kitchen', nameBn: 'হোম ও কিচেন', nameAr: 'المنزل والمطبخ' },
  { id: 'women', name: "Women's Clothing", nameBn: 'নারী পোশাক', nameAr: 'ملابس نسائية' },
  { id: 'women_curve', name: "Women's Curve Clothing", nameBn: 'কার্ভ পোশাক', nameAr: 'مقاسات كبيرة نسائية' },
  { id: 'women_shoes', name: "Women's Shoes", nameBn: 'মহিলাদের জুতা', nameAr: 'أحذية نسائية' },
  { id: 'lingerie', name: "Women's Lingerie & Lounge", nameBn: 'লাউঞ্জ ও ইনারওয়্যার', nameAr: 'لانجري وملابس نوم' },
  { id: 'men', name: "Men's Clothing", nameBn: 'পুরুষ পোশাক', nameAr: 'ملابس رجالية' },
  { id: 'men_shoes', name: "Men's Shoes", nameBn: 'পুরুষদের জুতা', nameAr: 'أحذية رجالية' },
  { id: 'men_tall', name: "Men's Big & Tall", nameBn: 'বিগ অ্যান্ড টল', nameAr: 'مقاسات كبيرة رجالية' },
  { id: 'men_sleep', name: "Men's Underwear & Sleepwear", nameBn: 'স্লিপওয়্যার', nameAr: 'ملابس نوم رجالية' },
  { id: 'sports', name: 'Sports & Outdoors', nameBn: 'স্পোর্টস ও ফিটনেস', nameAr: 'رياضة وأنشطة خارجية' },
  { id: 'jewelry', name: 'Jewelry & Accessories', nameBn: 'গহনা ও এক্সেসরিজ', nameAr: 'مجوهرات وإكسسوارات' },
  { id: 'beauty', name: 'Beauty & Personal Care', nameBn: 'বিউটি ও কেয়ার', nameAr: 'الجمال والعناية الشخصية' },
  { id: 'toys', name: 'Toys & Games', nameBn: 'খেলনা ও গেমস', nameAr: 'ألعاب وترفيه' }
];

const SUBCATEGORIES: Record<string, SubCategoryItem[]> = {
  featured: [
    {
      id: 'sub-women-jewelry',
      name: "Women's Jewelry",
      nameBn: 'নারী জুয়েলারি',
      nameAr: 'مجوهرات نسائية',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'গহনা ও এক্সেসরিজ'
    },
    {
      id: 'sub-home-decor',
      name: 'Home Decor Products',
      nameBn: 'হোম ডেকোর',
      nameAr: 'ديكورات منزلية',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80',
      isHot: true,
      filterCategory: 'হোম ও কিচেন'
    },
    {
      id: 'sub-cases',
      name: 'Cases, Holsters & Sleeves',
      nameBn: 'ফোন কেস ও কভার',
      nameAr: 'أغطية وحافظات الهواتف',
      image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&auto=format&fit=crop&q=80',
      isHot: true,
      filterCategory: 'গ্যাজেট ও ইলেকট্রনিক্স'
    },
    {
      id: 'sub-women-coats',
      name: "Women's Coats & Jackets",
      nameBn: 'নারী কোট ও জ্যাকেট',
      nameAr: 'معاطف وجواكيت نسائية',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'নারী ফ্যাশন'
    },
    {
      id: 'sub-women-dresses',
      name: "Women's Dresses",
      nameBn: 'নারী ড্রেস ও কুর্তি',
      nameAr: 'فساتين نسائية',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'নারী ফ্যাশন'
    },
    {
      id: 'sub-women-sweaters',
      name: "Women's Sweaters",
      nameBn: 'নারী সোয়েটার',
      nameAr: 'كنزات وسترات نسائية',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'নারী ফ্যাশন'
    },
    {
      id: 'sub-men-activewear',
      name: "Men's Activewear",
      nameBn: 'পুরুষ একটিভওয়্যার',
      nameAr: 'ملابس رياضية رجالية',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
      isHot: true,
      filterCategory: 'পুরুষ ফ্যাশন'
    },
    {
      id: 'sub-women-tshirt',
      name: "Women's T-Shirt",
      nameBn: 'নারী টি-শার্ট',
      nameAr: 'تيشيرتات نسائية',
      image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'নারী ফ্যাশন'
    },
    {
      id: 'sub-men-jackets',
      name: "Men's Jackets & Coats",
      nameBn: 'পুরুষ জ্যাকেট ও কোট',
      nameAr: 'جواكيت ومعاطف رجالية',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'পুরুষ ফ্যাশন'
    },
    {
      id: 'sub-earbuds',
      name: 'Headphones, Earbuds & Accessories',
      nameBn: 'ইয়ারফোন ও হেডফোন',
      nameAr: 'سماعات أذن وإكسسوارات',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
      isHot: true,
      filterCategory: 'গ্যাজেট ও ইলেকট্রনিক্স'
    },
    {
      id: 'sub-two-piece',
      name: "Women's Two Piece Sets",
      nameBn: 'টু-পিস সেট',
      nameAr: 'أطقم نسائية قطعتين',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'নারী ফ্যাশন'
    },
    {
      id: 'sub-seasonal-decor',
      name: 'Seasonal Decor',
      nameBn: 'সিজনাল ডেকোরেশন',
      nameAr: 'ديكورات موسمية',
      image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'হোম ও কিচেন'
    },
    {
      id: 'sub-kitchen-utensils',
      name: 'Kitchen Utensils & Supplies',
      nameBn: 'কিচেন তৈজসপত্র',
      nameAr: 'أدوات ومستلزمات المطبخ',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'হোম ও কিচেন'
    },
    {
      id: 'sub-kitchen-storage',
      name: 'Kitchen Storage & Organization',
      nameBn: 'কিচেন স্টোরেজ',
      nameAr: 'تنظيم وتخزين المطبخ',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'হোম ও কিচেন'
    },
    {
      id: 'sub-baby-sets',
      name: 'Baby Sets',
      nameBn: 'বেবি সেট পোশাক',
      nameAr: 'أطقم ملابس أطفال',
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'বাচ্চাদের ফ্যাশন'
    },
    {
      id: 'sub-home-storage',
      name: 'Home Storage & Organization',
      nameBn: 'হোম অর্গানাইজার',
      nameAr: 'ترتيب وتنظيم المنزل',
      image: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'হোম ও কিচেন'
    },
    {
      id: 'sub-sports-acc',
      name: 'Sports & Outdoor Accessories',
      nameBn: 'স্পোর্টস সামগ্রী ও জুতা',
      nameAr: 'إكسسوارات رياضية وأحذية',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'স্পোর্টস ও ফিটনেস'
    },
    {
      id: 'sub-bedding',
      name: 'Bedding',
      nameBn: 'বেডিং ও চাদর',
      nameAr: 'مفارش وأغطية السرير',
      image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&auto=format&fit=crop&q=80',
      filterCategory: 'হোম ও কিচেন'
    }
  ]
};

export const TemuCategoriesView: React.FC<TemuCategoriesViewProps> = ({
  products,
  onSelectCategory,
  onOpenSearch,
  language = 'bn'
}) => {
  const [selectedSidebar, setSelectedSidebar] = useState('featured');
  const [showGiftModal, setShowGiftModal] = useState(false);

  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const getSubcategoryName = (sub: SubCategoryItem) => {
    if (isBn) return sub.nameBn;
    if (isAr) return sub.nameAr;
    return sub.name;
  };

  const getSidebarName = (item: (typeof SIDEBAR_CATEGORIES)[0]) => {
    if (isBn) return item.nameBn;
    if (isAr) return item.nameAr;
    return item.name;
  };

  const subItems = SUBCATEGORIES[selectedSidebar] || SUBCATEGORIES.featured;

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] bg-white dark:bg-slate-900 pb-20">
      
      {/* 1. Top Search Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5">
        <div
          onClick={onOpenSearch}
          className="flex items-center gap-2 bg-[#f4f4f4] dark:bg-slate-800 rounded-full px-3.5 py-2 cursor-pointer border border-transparent hover:border-[#fb7701] transition-colors"
        >
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="flex-1 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            {t('searchPlaceholder', language)}
          </span>
          <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center shrink-0">
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Trust Header strip */}
        <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold pt-2 px-1">
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('freeDelivery', language)}</span>
          </span>
          <span className="flex items-center gap-0.5 text-slate-700 dark:text-slate-300">
            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
            <span>{t('deliveryGuarantee', language)}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </span>
        </div>
      </div>

      {/* 2. Dual-Pane Categories Content (Sidebar Left, Grid Right) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Vertical Category Nav (Scrollable) */}
        <aside className="w-24 sm:w-28 bg-[#f7f7f7] dark:bg-slate-850 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-slate-800 scrollbar-none py-1">
          {SIDEBAR_CATEGORIES.map((cat) => {
            const isActive = selectedSidebar === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedSidebar(cat.id)}
                className={`relative w-full py-3.5 px-2 text-center text-xs leading-tight transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-[#fb7701] font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 font-semibold'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#fb7701] rounded-r" />
                )}
                <span className="line-clamp-2">{getSidebarName(cat)}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Subcategory Circular Image Grid */}
        <main className="flex-1 p-3 overflow-y-auto relative">
          <div className="mb-3">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">
              {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী শপ করুন' : language === 'ar' ? 'تسوق حسب الفئة' : 'Shop by category'}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-x-2 gap-y-4">
            {subItems.map((sub) => (
              <div
                key={sub.id}
                onClick={() => onSelectCategory(sub.filterCategory)}
                className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
              >
                {/* Circular image with optional HOT pill */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-1.5 shadow-xs">
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  {sub.isHot && (
                    <span className="absolute top-0 right-0 bg-[#fb7701] text-white text-[8px] font-black px-1 rounded-bl shadow-xs">
                      HOT
                    </span>
                  )}
                </div>

                {/* Subcategory Label */}
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                  {getSubcategoryName(sub)}
                </span>
              </div>
            ))}
          </div>

          {/* Floating Gift Box from Temu screenshot */}
          <div
            onClick={() => setShowGiftModal(true)}
            className="fixed bottom-24 right-4 z-30 cursor-pointer animate-bounce group"
          >
            <div className="relative w-14 h-14 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-2xl shadow-xl flex items-center justify-center border-2 border-white text-orange-600">
              <Gift className="w-8 h-8 drop-shadow" />
              <span className="absolute -bottom-2 bg-yellow-400 text-amber-950 font-black text-[9px] px-2 py-0.5 rounded-full border border-yellow-200 shadow-xs uppercase">
                {language === 'bn' ? 'উপহার' : language === 'ar' ? 'افتحها' : 'Open it'}
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Gift Modal */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg">
              🎁
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              {language === 'bn' ? '🎉 অভিনন্দন! আজকের স্পেশাল সারপ্রাইজ উপহার' : '🎉 Congratulations! Today\'s Special Gift'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {language === 'bn' ? 'Market places এ প্রথম অর্ডারে পাচ্ছেন নিশ্চিত ফ্রি ডেলিভারি ও বিশেষ ক্যাশব্যাক অফার!' : 'Get guaranteed free shipping and exclusive cashback on qualifying orders!'}
            </p>
            <button
              onClick={() => setShowGiftModal(false)}
              className="w-full py-3 bg-[#fb7701] hover:bg-[#e65100] text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              {language === 'bn' ? 'উপহার সংগ্রহ করুন' : 'Claim Gift'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
