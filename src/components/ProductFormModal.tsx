import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../data/initialProducts';
import { X, ArrowLeft, Plus, Upload, Check, Image as ImageIcon } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const PRESET_IMAGES = [
  { label: 'খাঁটি মধু', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80' },
  { label: 'স্মার্ট ওয়াচ', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80' },
  { label: 'লেদার ব্যাগ', url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80' },
  { label: 'সিল্ক পাঞ্জাবি', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80' }
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(product?.title || '');
  const [category, setCategory] = useState(product?.category || 'সাধারণ');
  const [price, setPrice] = useState<number | string>(product?.price || '');
  const [originalPrice, setOriginalPrice] = useState<number | string>(product?.originalPrice || '');
  const [sellerPhone, setSellerPhone] = useState(product?.sellerPhone || '01700000000');
  const [whatsappNumber, setWhatsappNumber] = useState(product?.whatsappNumber || '8801700000000');
  const [description, setDescription] = useState(product?.description || '');
  const [image, setImage] = useState(product?.image || PRESET_IMAGES[0].url);
  const [featuresText, setFeaturesText] = useState(product?.features?.join('\n') || 'ক্যাশ অন ডেলিভারি সুবিধা\nদ্রুততম হোম ডেলিভারি');
  const [stockStatus, setStockStatus] = useState<Product['stockStatus']>(product?.stockStatus || 'in_stock');
  const [badge, setBadge] = useState(product?.badge || '');
  const [unit, setUnit] = useState(product?.unit || 'পিস');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setTitle(product.title);
      setCategory(product.category);
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || '');
      setSellerPhone(product.sellerPhone);
      setWhatsappNumber(product.whatsappNumber);
      setDescription(product.description);
      setImage(product.image);
      setFeaturesText(product.features?.join('\n') || '');
      setStockStatus(product.stockStatus);
      setBadge(product.badge || '');
      setUnit(product.unit || 'পিস');
    }
  }, [product]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 900;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setImage(canvas.toDataURL('image/jpeg', 0.82));
            return;
          }
        } catch {
          // fallback to raw dataUrl
        }
        setImage(dataUrl);
      };
      img.onerror = () => setImage(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('পণ্যের নাম লিখুন');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('সঠিক পণ্যের মূল্য প্রদান করুন');
      return;
    }
    if (!sellerPhone.trim()) {
      setError('সেলার ফোন নম্বর প্রদান করুন');
      return;
    }

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const savedProduct: Product = {
      ...(product || {}),
      id: product?.id || `prod-${Date.now()}`,
      title: title.trim(),
      titleEn: undefined,
      category: category === 'সব পণ্য' ? 'সাধারণ' : category,
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      sellerPhone: sellerPhone.trim(),
      whatsappNumber: whatsappNumber.trim() || sellerPhone.trim(),
      description: description.trim() || 'পণ্যের বিস্তারিত বিবরণ পরবর্তীতে আপডেট করা হবে।',
      descriptionEn: undefined,
      image: image || PRESET_IMAGES[0].url,
      features,
      stockStatus,
      badge: badge.trim() || undefined,
      unit: unit.trim() || 'পিস',
      updatedAt: new Date().toISOString()
    };

    onSave(savedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header with Back button */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
              title="পেছনে যান"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              {product ? 'পণ্যের তথ্য পরিবর্তন করুন' : 'নতুন পণ্য প্রদর্শন তালিকায় যুক্ত করুন'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পণ্যের নাম <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="যেমন: প্রিমিয়াম অর্গানিক মধু"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.filter(c => c !== 'সব পণ্য').map((cat, idx) => (
                  <option key={idx} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                স্পেশাল ব্যাজ / ট্যাগ (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: সেরা অফার, জনপ্রিয়, নতুন"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বিক্রয় মূল্য (টাকা) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="যেমন: ৫০০"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                আগের মূল্য (ঐচ্ছিক - ডিসকাউন্ট)
              </label>
              <input
                type="number"
                min="1"
                placeholder="যেমন: ৬৫০"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                একক (Unit)
              </label>
              <input
                type="text"
                placeholder="যেমন: পিস, কেজি, বোতল"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Seller Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                কল করার নম্বর <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="যেমন: 01700000000"
                value={sellerPhone}
                onChange={(e) => setSellerPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                হোয়াটসঅ্যাপ নম্বর
              </label>
              <input
                type="tel"
                placeholder="যেমন: 8801700000000"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Image Selection / Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              পণ্যের ছবি
            </label>
            
            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_IMAGES.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImage(p.url)}
                  className={`p-1 rounded-lg border text-left transition-all relative overflow-hidden ${
                    image === p.url ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-12 object-cover rounded" />
                  <div className="text-[10px] text-slate-700 font-medium truncate mt-1 text-center">{p.label}</div>
                  {image === p.url && (
                    <div className="absolute top-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom URL or upload file */}
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="অথবা ছবির সরাসরি ওয়েব লিঙ্ক (URL) দিন"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>ফাইল আপলোড</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              পণ্যের বিস্তারিত বিবরণ ও বৈশিষ্ট্য
            </label>
            <textarea
              rows={3}
              placeholder="এখানে আপনার পণ্যের বিস্তারিত বিবরণ ও বৈশিষ্ট্যগুলো সুন্দর করে লিখে দিন..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Feature highlights */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              মূল বৈশিষ্ট্যসমূহ (প্রতি লাইনে একটি করে লিখুন)
            </label>
            <textarea
              rows={2}
              placeholder="১০০% খাঁটি ও প্রাকৃতিক&#10;ক্যাশ অন ডেলিভারি সুবিধা&#10;৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{product ? 'পরিবর্তন সংরক্ষণ করুন' : 'পণ্য যোগ করুন'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
