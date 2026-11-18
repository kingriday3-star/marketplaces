import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Send,
  Headphones,
  Bot,
  Settings,
  ShieldCheck,
  Phone,
  Truck,
  RefreshCw,
  Wallet,
  Package,
  AlertCircle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  Order,
  SupportAgentConfig,
  SupportChatMessage,
  User
} from '../types';
import { SupportedLanguage, formatMoney, resolveBaseLang, t } from '../utils/i18n';
import { sendSupportAiMessage, updateSupportConfig } from '../utils/realtimeClient';

interface SupportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  orders: Order[];
  walletBalance: number;
  supportConfig: SupportAgentConfig;
  onConfigUpdated?: (cfg: SupportAgentConfig) => void;
  onOpenOrders?: () => void;
  onOpenRefundCenter?: () => void;
  onOpenDeliveryGuarantee?: () => void;
  onOpenWallet?: () => void;
  language?: SupportedLanguage;
}

export const SupportCenterModal: React.FC<SupportCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  orders,
  walletBalance,
  supportConfig,
  onConfigUpdated,
  onOpenOrders,
  onOpenRefundCenter,
  onOpenDeliveryGuarantee,
  onOpenWallet,
  language = 'bn'
}) => {
  const baseLang = resolveBaseLang(language);
  const isBn = baseLang === 'bn';
  const isAr = baseLang === 'ar';

  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Admin AI Agent Config drawer state
  const [showAdminConfig, setShowAdminConfig] = useState(false);
  const [cfgEnabled, setCfgEnabled] = useState(supportConfig.enabled);
  const [cfgName, setCfgName] = useState(supportConfig.agentName);
  const [cfgGreetingBn, setCfgGreetingBn] = useState(supportConfig.greetingBn);
  const [cfgGreetingEn, setCfgGreetingEn] = useState(supportConfig.greetingEn);
  const [cfgInstructions, setCfgInstructions] = useState(supportConfig.customInstructions);
  const [cfgPhone, setCfgPhone] = useState(supportConfig.supportPhone);
  const [cfgWhatsapp, setCfgWhatsapp] = useState(supportConfig.supportWhatsapp);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCfgEnabled(supportConfig.enabled);
    setCfgName(supportConfig.agentName);
    setCfgGreetingBn(supportConfig.greetingBn);
    setCfgGreetingEn(supportConfig.greetingEn);
    setCfgInstructions(supportConfig.customInstructions);
    setCfgPhone(supportConfig.supportPhone);
    setCfgWhatsapp(supportConfig.supportWhatsapp);
  }, [supportConfig]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          text: isBn
            ? supportConfig.greetingBn
            : isAr
            ? `مرحباً بك في ${supportConfig.agentName}! كيف يمكنني مساعدتك اليوم بخصوص الطلبات أو الاسترداد أو التوصيل؟`
            : supportConfig.greetingEn,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [isOpen, messages.length, isBn, isAr, supportConfig.greetingBn, supportConfig.greetingEn, supportConfig.agentName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (!isOpen) return null;

  const myOrders = orders
    .filter((o) => {
      if (!currentUser) return true;
      return (
        o.customerId === currentUser.id ||
        o.customerPhone === currentUser.identifier ||
        o.customerName === currentUser.name
      );
    })
    .slice(0, 5);

  const handleSend = async (customText?: string) => {
    const query = (customText ?? inputText).trim();
    if (!query || sending) return;

    setErrorMsg('');
    if (!customText) setInputText('');

    const userMsg: SupportChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setSending(true);

    const res = await sendSupportAiMessage({
      message: query,
      history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
      language,
      customerContext: {
        name: currentUser?.name || 'Customer',
        creditBalance: walletBalance,
        recentOrders: myOrders.map((o) => ({
          id: o.id,
          productTitle: o.productTitle,
          status: o.status,
          totalAmount: o.totalAmount
        }))
      }
    });

    setSending(false);

    if (!res.ok || !res.reply) {
      setErrorMsg(
        res.error ||
          (isBn
            ? 'AI সাপোর্ট সার্ভিসে সংযোগ পাওয়া যায়নি। নিচের দ্রুত অপশন বা হেল্পলাইনে যোগাযোগ করুন।'
            : 'Support AI could not respond right now. Use quick actions or helpline below.')
      );
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: res.reply!,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleSaveAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.identifier) return;
    setSavingConfig(true);
    setConfigSavedNotice('');
    const res = await updateSupportConfig(
      {
        enabled: cfgEnabled,
        agentName: cfgName.trim() || 'Market places AI Agent',
        greetingBn: cfgGreetingBn.trim(),
        greetingEn: cfgGreetingEn.trim(),
        customInstructions: cfgInstructions.trim(),
        supportPhone: cfgPhone.trim(),
        supportWhatsapp: cfgWhatsapp.trim()
      },
      currentUser.identifier
    );
    setSavingConfig(false);
    if (res.ok && res.supportConfig) {
      onConfigUpdated?.(res.supportConfig);
      setConfigSavedNotice(
        isBn ? 'AI সাপোর্ট এজেন্ট সেটিংস সেভ হয়েছে!' : 'AI Support Agent configuration saved!'
      );
      setTimeout(() => {
        setConfigSavedNotice('');
        setShowAdminConfig(false);
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to update AI Support config');
    }
  };

  const quickPrompts = isBn
    ? [
        'আমার অর্ডার এখন কোথায় আছে?',
        'ডেলিভারি পেতে কত সময় লাগে?',
        'ত্রুটিপূর্ণ পণ্যের রিফান্ড কীভাবে পাবো?',
        'ক্রেডিট ব্যালেন্স কীভাবে ব্যবহার করবো?'
      ]
    : isAr
    ? [
        'أين طلبي الآن؟',
        'كم يستغرق التوصيل؟',
        'كيف أطلب استرداد الأموال؟',
        'كيف أستخدم رصيد الائتمان؟'
      ]
    : [
        'Where is my order right now?',
        'What is the delivery guarantee timeline?',
        'How do I claim a guaranteed refund?',
        'How can I use my credit balance?'
      ];

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl h-[90vh] max-h-[760px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Top Support Center Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-2 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer shrink-0"
              title={t('back', language)}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#fb7701] to-amber-500 flex items-center justify-center shadow-md shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black truncate">
                  {isBn ? 'Market places সাপোর্ট সেন্টার' : 'Market places Support Center'}
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase shrink-0">
                  {supportConfig.enabled ? 'AI Live' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {supportConfig.agentName} · {isBn ? '২৪/৭ সমস্যা সমাধান সহায়তা' : '24/7 Instant Problem Solver'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Strictly Visible ONLY for Admin so owner can customize AI Agent rules/persona */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowAdminConfig(!showAdminConfig)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer transition-colors ${
                  showAdminConfig
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
                }`}
                title="Configure AI Support Agent"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBn ? 'AI সেটআপ' : 'AI Setup'}</span>
              </button>
            )}
            <a
              href={`tel:${supportConfig.supportPhone}`}
              className="p-2 rounded-full bg-white/10 hover:bg-[#fb7701] text-white transition-colors"
              title={supportConfig.supportPhone}
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title={t('close', language)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Self-Service Action Strip */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-[11px] font-bold">
          {onOpenOrders && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOrders();
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:border-[#fb7701] shrink-0 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-[#fb7701]" />
              <span>{isBn ? 'অর্ডার ট্র্যাকিং' : 'Track Orders'}</span>
            </button>
          )}
          {onOpenRefundCenter && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRefundCenter();
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:border-emerald-500 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'রিফান্ড আবেদন' : 'Guaranteed Refund'}</span>
            </button>
          )}
          {onOpenDeliveryGuarantee && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeliveryGuarantee();
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:border-emerald-500 shrink-0 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('deliveryGuarantee', language)}</span>
            </button>
          )}
          {onOpenWallet && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWallet();
              }}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:border-[#fb7701] shrink-0 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#fb7701]" />
              <span>
                {isBn ? 'ব্যালেন্স' : 'Credit'}: {formatMoney(walletBalance, language)}
              </span>
            </button>
          )}
        </div>

        {/* Admin AI Support Agent Configurator (Strictly Admin Only) */}
        {isAdmin && showAdminConfig ? (
          <form onSubmit={handleSaveAdminConfig} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-emerald-50/40 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{isBn ? 'এজেন্ট AI কাস্টমাইজেশন (এডমিন)' : 'Configure Store AI Support Agent'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminConfig(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                {isBn ? 'চ্যাটে ফিরুন' : 'Back to Chat'}
              </button>
            </div>

            {configSavedNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configSavedNotice}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {isBn ? 'AI সাপোর্ট এজেন্ট চালু রাখুন' : 'Enable AI Support Agent'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isBn ? 'গ্রাহকদের প্রশ্নের তাৎক্ষণিক উত্তর দিবে' : 'Automatically assists customers 24/7'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCfgEnabled(!cfgEnabled)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  cfgEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    cfgEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isBn ? 'AI এজেন্টের নাম' : 'AI Agent Name'}
                </label>
                <input
                  type="text"
                  value={cfgName}
                  onChange={(e) => setCfgName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isBn ? 'হেল্পলাইন নম্বর' : 'Support Phone Number'}
                </label>
                <input
                  type="text"
                  value={cfgPhone}
                  onChange={(e) => setCfgPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isBn ? 'স্বাগতম বার্তা (বাংলা)' : 'Welcome Greeting (Bengali)'}
              </label>
              <input
                type="text"
                value={cfgGreetingBn}
                onChange={(e) => setCfgGreetingBn(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isBn ? 'স্বাগতম বার্তা (ইংরেজি)' : 'Welcome Greeting (English)'}
              </label>
              <input
                type="text"
                value={cfgGreetingEn}
                onChange={(e) => setCfgGreetingEn(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isBn
                  ? 'স্টোরের নিয়ম ও AI নির্দেশনা (রিফান্ড, ডেলিভারি ও নীতিমালা)'
                  : 'AI Store Knowledge & Policy Instructions'}
              </label>
              <textarea
                rows={4}
                value={cfgInstructions}
                onChange={(e) => setCfgInstructions(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer"
            >
              {savingConfig
                ? isBn
                  ? 'সেভ হচ্ছে...'
                  : 'Saving...'
                : isBn
                ? 'AI এজেন্ট কনফিগারেশন সেভ করুন'
                : 'Save AI Agent Configuration'}
            </button>
          </form>
        ) : (
          /* Customer Interactive AI Chat Body */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f7f7f7] dark:bg-slate-950">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#fb7701] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-[#fb7701] text-white rounded-br-sm font-medium'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#fb7701] text-white flex items-center justify-center shrink-0">
                    <Headphones className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    {isBn ? 'উত্তর তৈরি হচ্ছে...' : 'Typing response...'}
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div>{errorMsg}</div>
                    <a
                      href={`tel:${supportConfig.supportPhone}`}
                      className="inline-flex items-center gap-1 text-[11px] font-black underline"
                    >
                      <Phone className="w-3 h-3" />
                      <span>
                        {isBn ? 'সরাসরি হেল্পলাইনে কল করুন:' : 'Call 24/7 Helpline:'} {supportConfig.supportPhone}
                      </span>
                    </a>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {quickPrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => void handleSend(promptText)}
                  disabled={sending}
                  className="px-2.5 py-1 rounded-full bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-slate-700 border border-orange-200/80 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSend();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isBn
                    ? 'আপনার সমস্যা বা প্রশ্ন এখানে লিখুন...'
                    : isAr
                    ? 'اكتب سؤالك أو مشكلتك هنا...'
                    : 'Type your question or issue here...'
                }
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full text-xs sm:text-sm outline-none focus:border-[#fb7701]"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-[#fb7701] hover:bg-[#e65100] disabled:opacity-50 text-white flex items-center justify-center shadow-md cursor-pointer shrink-0 active:scale-95 transition-all"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
