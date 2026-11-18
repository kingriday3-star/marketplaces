import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  authenticateWithServer,
  sendSignupOtp,
  verifySignupOtp,
  registerWithOtpServer,
  isEmailAddress,
  normalizePhoneNumber
} from '../utils/auth';
import { SupportedLanguage, t, resolveBaseLang } from '../utils/i18n';
import { toBengaliNumber } from '../utils/bengali';
import {
  X,
  ArrowLeft,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
  initialMethod?: 'gmail' | 'phone';
  language?: SupportedLanguage;
}

type RegisterStep = 'form' | 'otp' | 'password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  initialMethod = 'gmail',
  language = 'bn'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'gmail' | 'phone'>(initialMethod);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');

  // Form fields
  const [name, setName] = useState('');
  const [gmailInput, setGmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpEmailInput, setOtpEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [deliveredTo, setDeliveredTo] = useState('');
  const [deliveryChannel, setDeliveryChannel] = useState<'email_gateway' | 'sms_gateway' | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // UI feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const baseLang = resolveBaseLang(language);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (initialMethod) setLoginMethod(initialMethod);
      setRegisterStep('form');
      setOtpCode('');
      setVerificationToken('');
      setDeliveryChannel(null);
      setDeliveredTo('');
      setResendCooldown(0);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, initialMode, initialMethod]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const getTargetIdentifier = () =>
    loginMethod === 'gmail' ? gmailInput.trim() : phoneInput.trim();

  const validateIdentifier = (): string | null => {
    const targetIdentifier = getTargetIdentifier();
    if (!targetIdentifier) {
      return baseLang === 'bn'
        ? loginMethod === 'gmail'
          ? 'অনুগ্রহ করে আপনার জিমেইল আইডি লিখুন'
          : 'অনুগ্রহ করে আপনার মোবাইল নম্বর লিখুন'
        : baseLang === 'ar'
          ? loginMethod === 'gmail'
            ? 'يرجى إدخال بريدك الإلكتروني (Gmail)'
            : 'يرجى إدخال رقم هاتفك المحمول'
          : loginMethod === 'gmail'
            ? 'Please enter your Gmail address'
            : 'Please enter your mobile number';
    }

    if (loginMethod === 'gmail') {
      if (!isEmailAddress(targetIdentifier)) {
        return baseLang === 'bn'
          ? 'সঠিক জিমেইল আইডি প্রদান করুন (যেমন: user@gmail.com)'
          : baseLang === 'ar'
            ? 'يرجى إدخال بريد إلكتروني صحيح'
            : 'Please enter a valid email address (e.g. user@gmail.com)';
      }
    } else {
      const clean = normalizePhoneNumber(targetIdentifier);
      if (clean.length < 10) {
        return baseLang === 'bn'
          ? 'সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
          : baseLang === 'ar'
            ? 'أدخل رقم هاتف محمول صحيح'
            : 'Enter a valid mobile number (at least 10 digits)';
      }
    }
    return null;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const idError = validateIdentifier();
    if (idError) {
      setError(idError);
      return;
    }

    if (!password) {
      setError(baseLang === 'bn' ? 'পাসওয়ার্ড প্রদান করুন' : baseLang === 'ar' ? 'يرجى إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    setLoading(true);
    const result = await authenticateWithServer(getTargetIdentifier(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.user) {
      setSuccessMsg(baseLang === 'bn' ? 'লগইন সফল হয়েছে!' : baseLang === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!');
      setTimeout(() => {
        onAuthSuccess(result.user!);
        onClose();
      }, 250);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError(baseLang === 'bn' ? 'আপনার পুরো নাম লিখুন' : baseLang === 'ar' ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }

    const idError = validateIdentifier();
    if (idError) {
      setError(idError);
      return;
    }

    const targetId = getTargetIdentifier();
    const fallbackMail = loginMethod === 'phone' ? otpEmailInput.trim() : undefined;

    if (loginMethod === 'phone' && (!fallbackMail || !isEmailAddress(fallbackMail))) {
      setError(
        baseLang === 'bn'
          ? '৬-ডিজিটের কোড পেতে আপনার সঠিক Gmail এড্রেসটি লিখুন (যেমন: name@gmail.com)'
          : 'Please enter a valid Gmail address to receive your 6-digit code'
      );
      return;
    }

    setLoading(true);
    const result = await sendSignupOtp(targetId, loginMethod, fallbackMail);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || (baseLang === 'bn' ? 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।' : 'Could not send verification code.'));
      return;
    }

    setMaskedTarget(result.maskedTarget || targetId);
    setDeliveredTo(result.deliveredTo || fallbackMail || (loginMethod === 'gmail' ? targetId : ''));
    setDeliveryChannel(result.deliveryChannel || 'email_gateway');
    setResendCooldown(60);
    setRegisterStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanCode = otpCode.replace(/\D/g, '').trim();
    if (cleanCode.length !== 6) {
      setError(
        baseLang === 'bn'
          ? 'দয়া করে সঠিক ৬-ডিজিটের ভেরিফিকেশন কোড দিন'
          : baseLang === 'ar'
            ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام'
            : 'Please enter the 6-digit verification code'
      );
      return;
    }

    setLoading(true);
    const result = await verifySignupOtp(getTargetIdentifier(), loginMethod, cleanCode);
    setLoading(false);

    if (!result.ok || !result.verificationToken) {
      setError(result.error || (baseLang === 'bn' ? 'ভেরিফিকেশন কোড মেলেনি!' : 'Invalid verification code.'));
      return;
    }

    setVerificationToken(result.verificationToken);
    setRegisterStep('password');
    setSuccessMsg(
      baseLang === 'bn'
        ? 'ভেরিফিকেশন সফল! এখন আপনার একাউন্টের পাসওয়ার্ড সেট করুন।'
        : baseLang === 'ar'
          ? 'تم التحقق بنجاح! قم بتعيين كلمة المرور الآن.'
          : 'Verified! Now set a strong password for your account.'
    );
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError(baseLang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError(baseLang === 'bn' ? 'উভয় পাসওয়ার্ড হুবহু মেলেনি' : 'Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await registerWithOtpServer(
      name.trim(),
      getTargetIdentifier(),
      password,
      loginMethod,
      verificationToken
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.user) {
      setSuccessMsg(
        baseLang === 'bn'
          ? 'ভেরিফাইড একাউন্ট সফলভাবে তৈরি হয়েছে!'
          : baseLang === 'ar'
            ? 'تم إنشاء حسابك الموثق بنجاح!'
            : 'Verified account created successfully!'
      );
      setTimeout(() => {
        onAuthSuccess(result.user!);
        onClose();
      }, 300);
    }
  };

  const handleAppendGmailDomain = () => {
    if (gmailInput && !gmailInput.includes('@')) {
      setGmailInput(`${gmailInput.trim()}@gmail.com`);
    }
  };

  const handleBackArrow = () => {
    if (mode === 'register' && registerStep === 'otp') {
      setRegisterStep('form');
      setError('');
      return;
    }
    if (mode === 'register' && registerStep === 'password') {
      setRegisterStep('otp');
      setError('');
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Back button */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={handleBackArrow}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title={t('back', language)}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title={t('close', language)}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center text-center mt-2">
            <div className="w-13 h-13 bg-[#0f1829] rounded-2xl overflow-hidden shadow-md border border-white/15 mb-2.5">
              <img src="/logo.png" alt="Market places" className="w-full h-full object-cover" />
            </div>
            <h3 className="text-lg sm:text-xl font-black">
              {mode === 'login'
                ? (baseLang === 'bn' ? 'Market places একাউন্টে লগইন' : baseLang === 'ar' ? 'تسجيل الدخول إلى Market places' : 'Sign in to Market places')
                : (baseLang === 'bn' ? 'ভেরিফাইড গ্রাহক একাউন্ট তৈরি' : baseLang === 'ar' ? 'إنشاء حساب موثق' : 'Create Verified Account')}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {mode === 'login'
                ? (baseLang === 'bn'
                    ? 'জিমেইল বা মোবাইল নম্বর এবং পাসওয়ার্ড দিয়ে প্রবেশ করুন'
                    : baseLang === 'ar'
                      ? 'سجل الدخول باستخدام البريد الإلكتروني أو الهاتف'
                      : 'Sign in securely with your Gmail or mobile number')
                : t('otpStep1Hint', language)}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Login vs Sign Up */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setRegisterStep('form');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            {baseLang === 'bn' ? 'লগইন করুন' : baseLang === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setRegisterStep('form');
              setError('');
              setSuccessMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            {baseLang === 'bn' ? 'নতুন একাউন্ট (OTP)' : baseLang === 'ar' ? 'حساب جديد (OTP)' : 'Sign Up (OTP)'}
          </button>
        </div>

        {/* Registration 3-Step Indicator */}
        {mode === 'register' && (
          <div className="px-6 pt-3 pb-1">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400">
              <span className={`flex items-center gap-1 ${registerStep === 'form' ? 'text-[#fb7701]' : 'text-emerald-600'}`}>
                <span className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center">
                  {registerStep === 'form' ? toBengaliNumber(1, language) : '✓'}
                </span>
                <span>{baseLang === 'bn' ? 'তথ্য' : 'Details'}</span>
              </span>
              <span className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />
              <span className={`flex items-center gap-1 ${registerStep === 'otp' ? 'text-[#fb7701]' : registerStep === 'password' ? 'text-emerald-600' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center">
                  {registerStep === 'password' ? '✓' : toBengaliNumber(2, language)}
                </span>
                <span>{baseLang === 'bn' ? '৬-ডিজিট কোড' : 'OTP Code'}</span>
              </span>
              <span className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2" />
              <span className={`flex items-center gap-1 ${registerStep === 'password' ? 'text-[#fb7701]' : ''}`}>
                <span className="w-4 h-4 rounded-full bg-current/15 flex items-center justify-center">
                  {toBengaliNumber(3, language)}
                </span>
                <span>{baseLang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
              </span>
            </div>
          </div>
        )}

        {/* Method Selector (Gmail vs Phone) shown in Login or Register Step 1 */}
        {(mode === 'login' || registerStep === 'form') && (
          <div className="px-6 pt-3 pb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {baseLang === 'bn' ? 'মাধ্যম নির্বাচন করুন:' : baseLang === 'ar' ? 'اختر الطريقة:' : 'Choose Verification Method:'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('gmail');
                  setError('');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  loginMethod === 'gmail'
                    ? 'border-[#0284c7] bg-sky-50 dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-300 shadow-xs ring-1 ring-[#0284c7]/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{baseLang === 'bn' ? 'জিমেইল (Gmail)' : 'Gmail'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone');
                  setError('');
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  loginMethod === 'phone'
                    ? 'border-[#0284c7] bg-sky-50 dark:bg-sky-950/50 text-[#0284c7] dark:text-sky-300 shadow-xs ring-1 ring-[#0284c7]/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{baseLang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Phone'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="px-6 pt-3 space-y-2">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-semibold">
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* ================= LOGIN FORM ================= */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 pt-3 space-y-3.5">
            {loginMethod === 'gmail' ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>{baseLang === 'bn' ? 'আপনার জিমেইল (Gmail)' : 'Gmail Address'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {gmailInput && !gmailInput.includes('@') && (
                    <button
                      type="button"
                      onClick={handleAppendGmailDomain}
                      className="text-[11px] text-[#0284c7] font-bold hover:underline cursor-pointer"
                    >
                      + @gmail.com
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="user@gmail.com"
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{baseLang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}</span>
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-xs font-bold text-slate-700 bg-slate-100 border-2 border-r-0 border-slate-300 rounded-l-xl">
                    +88
                  </span>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="017XXXXXXXX"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-r-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{baseLang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder={baseLang === 'bn' ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#fb7701] caret-orange-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:brightness-105 active:scale-[0.99] text-white text-sm font-black rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {loading
                  ? t('verifyingCodeBtn', language)
                  : loginMethod === 'gmail'
                    ? (baseLang === 'bn' ? 'জিমেইল দিয়ে লগইন করুন' : 'Sign in with Gmail')
                    : (baseLang === 'bn' ? 'মোবাইল নম্বর দিয়ে লগইন করুন' : 'Sign in with Phone')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= REGISTER STEP 1: CONTACT DETAILS & LIVE GMAIL OTP ================= */}
        {mode === 'register' && registerStep === 'form' && (
          <form onSubmit={handleSendOtp} className="p-6 pt-3 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{baseLang === 'bn' ? 'আপনার পুরো নাম' : 'Full Name'}</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={baseLang === 'bn' ? 'যেমন: মোঃ সাকিব হোসেন' : 'e.g. John Doe'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
              />
            </div>

            {loginMethod === 'gmail' ? (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>{baseLang === 'bn' ? 'আপনার সচল জিমেইল' : 'Active Gmail Address'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  {gmailInput && !gmailInput.includes('@') && (
                    <button
                      type="button"
                      onClick={handleAppendGmailDomain}
                      className="text-[11px] text-[#0284c7] font-bold hover:underline cursor-pointer"
                    >
                      + @gmail.com
                    </button>
                  )}
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@gmail.com"
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {baseLang === 'bn'
                    ? 'সরাসরি এই জিমেইলের ইনবক্সে ৬-ডিজিটের রিয়েল ভেরিফিকেশন কোড পাঠানো হবে।'
                    : 'A live 6-digit verification code will be sent directly to this Gmail inbox.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{baseLang === 'bn' ? 'আপনার সচল মোবাইল নম্বর' : 'Active Mobile Phone'}</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-xs font-bold text-slate-700 bg-slate-100 border-2 border-r-0 border-slate-300 rounded-l-xl">
                      +88
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-r-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {baseLang === 'bn'
                        ? 'কোড পাওয়ার জন্য আপনার Gmail'
                        : 'Your Gmail to Receive Code'}
                    </span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={otpEmailInput}
                    onChange={(e) => setOtpEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#0284c7] caret-blue-600 shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {baseLang === 'bn'
                      ? 'এই জিমেইলের ইনবক্সে আপনার ৬-ডিজিটের রিয়েল কোড যাবে।'
                      : 'Your 6-digit verification code will be sent directly to this Gmail inbox.'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:brightness-105 active:scale-[0.99] text-white text-sm font-black rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {loading
                  ? t('sendingOtpBtn', language)
                  : baseLang === 'bn'
                    ? 'Gmail ইনবক্সে ৬-ডিজিট কোড পাঠান'
                    : 'Send 6-Digit Code to Gmail'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= REGISTER STEP 2: VERIFY 6-DIGIT OTP FROM PERSONAL INBOX ================= */}
        {mode === 'register' && registerStep === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 pt-3 space-y-3.5">
            <div className="p-4 bg-[#141519] text-white border border-slate-700 rounded-2xl text-xs space-y-3 shadow-md">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2979ff] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-black text-white text-xs">
                    {deliveryChannel === 'sms_gateway'
                      ? (baseLang === 'bn' ? 'SMS ইনবক্সে কোড পাঠানো হয়েছে' : 'Code Sent via SMS')
                      : (baseLang === 'bn' ? 'আপনার Gmail ইনবক্সে কোড পাঠানো হয়েছে!' : 'Code Sent to Your Gmail Inbox!')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep('form');
                    setError('');
                  }}
                  className="text-[11px] text-[#fb7701] font-extrabold hover:underline cursor-pointer shrink-0"
                >
                  {t('changeContactInfo', language)}
                </button>
              </div>

              <div className="bg-[#202229] rounded-xl p-3 border border-white/10 space-y-1">
                <div className="text-[10px] text-slate-400">
                  {baseLang === 'bn' ? 'ভেরিফিকেশন ইমেইল পাঠানো হয়েছে:' : 'Delivered to Gmail Inbox:'}
                </div>
                <div className="font-mono font-black text-white text-sm truncate">
                  {deliveredTo || maskedTarget}
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                {baseLang === 'bn'
                  ? 'আপনার পার্সোনাল Gmail অ্যাপ / ইনবক্সে "Market places Verification Code" নামে একটি ডার্ক কার্ড মেইল গেছে (না পেলে Spam বা All Mail চেক করুন)। সেখান থেকে ৬-ডিজিটের কোডটি নিয়ে নিচে বসান।'
                  : 'Open your personal Gmail inbox (or Spam / All Mail), find the verification code email from Market places, and enter the 6-digit code below.'}
              </p>

              {deliveryChannel !== 'sms_gateway' && (
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-[#2979ff] hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{baseLang === 'bn' ? 'পার্সোনাল Gmail ইনবক্স খুলুন' : 'Open Personal Gmail Inbox'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('enterOtpTitle', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                required
                autoFocus
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 text-center text-xl font-mono font-black tracking-[0.4em] text-slate-900 bg-white placeholder:text-slate-300 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#fb7701] caret-orange-600 shadow-xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              {resendCooldown > 0 ? (
                <span className="text-slate-500 dark:text-slate-400 font-semibold">
                  {t('resendOtpIn', language)} {toBengaliNumber(resendCooldown, language)}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-[#0284c7] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('resendOtpNow', language)}</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-[0.99] text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? t('verifyingCodeBtn', language) : t('verifyCodeBtn', language)}</span>
            </button>
          </form>
        )}

        {/* ================= REGISTER STEP 3: SET PASSWORD ================= */}
        {mode === 'register' && registerStep === 'password' && (
          <form onSubmit={handleCompleteRegistration} className="p-6 pt-3 space-y-3.5">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate">
                  {getTargetIdentifier()}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full shrink-0">
                ✓ {t('verifiedBadgeLabel', language)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{baseLang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Create Password'}</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoFocus
                  placeholder={baseLang === 'bn' ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#fb7701] caret-orange-600 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {baseLang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'} <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder={baseLang === 'bn' ? 'আবার পাসওয়ার্ড লিখুন' : 'Re-enter password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm font-bold text-slate-900 bg-white placeholder:text-slate-400 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-[#fb7701] caret-orange-600 shadow-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#fb7701] to-[#ff5000] hover:brightness-105 active:scale-[0.99] text-white text-sm font-black rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? t('verifyingCodeBtn', language) : t('createVerifiedAccountBtn', language)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
