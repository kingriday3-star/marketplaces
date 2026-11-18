const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const HINDI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function getBaseLanguage(lang: string = 'bn'): string {
  return (lang || 'bn').split('-')[0].toLowerCase();
}

export function toBengaliNumber(num: number | string, lang: string = 'bn'): string {
  if (num === undefined || num === null) return '';
  const str = num.toString();
  const baseLang = getBaseLanguage(lang);
  if (baseLang === 'bn') {
    return str.replace(/\d/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
  }
  if (baseLang === 'ar') {
    return str.replace(/\d/g, (digit) => ARABIC_DIGITS[parseInt(digit, 10)]);
  }
  if (baseLang === 'hi') {
    return str.replace(/\d/g, (digit) => HINDI_DIGITS[parseInt(digit, 10)]);
  }
  if (baseLang === 'ur') {
    return str.replace(/\d/g, (digit) => URDU_DIGITS[parseInt(digit, 10)]);
  }
  return str;
}

export function formatTaka(amount: number, lang: string = 'bn'): string {
  const baseLang = getBaseLanguage(lang);
  if (isNaN(amount)) {
    if (baseLang === 'bn') return '০ টাকা';
    if (baseLang === 'ar') return '٠ ৳';
    if (baseLang === 'ur') return '۰ ৳';
    if (baseLang === 'hi') return '० ৳';
    return '৳ 0';
  }
  const formatted = new Intl.NumberFormat(baseLang === 'bn' ? 'en-IN' : 'en-US').format(amount);
  if (baseLang === 'bn') {
    return `${toBengaliNumber(formatted, 'bn')} টাকা`;
  }
  if (baseLang === 'ar' || baseLang === 'ur' || baseLang === 'hi') {
    return `${toBengaliNumber(formatted, baseLang)} ৳`;
  }
  return `৳ ${formatted}`;
}

export function formatTakaSymbol(amount: number, lang: string = 'bn'): string {
  const baseLang = getBaseLanguage(lang);
  if (isNaN(amount)) return '৳ 0';
  const formatted = new Intl.NumberFormat(baseLang === 'bn' ? 'en-IN' : 'en-US').format(amount);
  if (baseLang === 'bn' || baseLang === 'ar' || baseLang === 'hi' || baseLang === 'ur') {
    return `৳ ${toBengaliNumber(formatted, baseLang)}`;
  }
  return `৳ ${formatted}`;
}

export function cleanPhoneForUrl(phone: string): string {
  // Remove non-digits
  let clean = phone.replace(/\D/g, '');
  // If starts with 01, add 88 for Bangladesh WhatsApp format
  if (clean.startsWith('01') && clean.length === 11) {
    clean = '88' + clean;
  }
  return clean;
}

export function buildWhatsAppOrderUrl(whatsappNumber: string, productTitle: string, price: number): string {
  const cleanNumber = cleanPhoneForUrl(whatsappNumber || '01700000000');
  const message = `আসসালামু আলাইকুম, আমি আপনার পণ্য প্রদর্শন থেকে এই পণ্যটি অর্ডার করতে চাই:
📦 পণ্য: ${productTitle}
💰 মূল্য: ${formatTaka(price)}
দয়া করে ডেলিভারি ও অর্ডার কনফার্মেশনের নিয়ম জানান। ধন্যবাদ!`;
  
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
