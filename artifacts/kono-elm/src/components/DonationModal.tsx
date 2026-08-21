'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Heart,
  Send,
  Loader2,
  QrCode,
  DollarSign,
  Info
} from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import QRCodeDisplay from './QRCodeDisplay';

export interface DonationSettings {
  enabled: boolean;
  show_button: boolean;
  wallet_address: string;
  currency: string;
  network: string;
  qr_code?: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  preset_amounts: number[];
  explorer_url_template: string;
}

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  initialSettings?: DonationSettings | null;
}

export default function DonationModal({
  isOpen,
  onClose,
  lang = 'ar',
  initialSettings = null
}: DonationModalProps) {
  const t = translations[lang];
  const [settings, setSettings] = useState<DonationSettings | null>(initialSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(!initialSettings);
  const [selectedAmount, setSelectedAmount] = useState<number | 'custom'>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState<'donate' | 'confirm'>('donate');

  // Confirmation Form State
  const [txHash, setTxHash] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Track Analytics Helper
  const trackEvent = (eventName: string, data?: Record<string, any>) => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, data);
      }
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', { name: eventName, ...data });
      }
    } catch (e) {
      // ignore analytics errors
    }
  };

  // Fetch settings from API if not provided
  useEffect(() => {
    if (isOpen) {
      trackEvent('donation_modal_opened');
      if (!settings) {
        setIsLoadingSettings(true);
        fetch('/api/donations/settings')
          .then((res) => res.json())
          .then((data) => {
            setSettings(data);
          })
          .catch((err) => {
            console.error('Error loading donation settings:', err);
          })
          .finally(() => {
            setIsLoadingSettings(false);
          });
      }
    }
  }, [isOpen, settings]);

  // Lock body scroll & handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCopyAddress = useCallback(() => {
    const address = settings?.wallet_address || 'TSC67u84nbzYSiKoDLBnVB3csFXLBFYUy6';
    if (!address) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true);
        setShowToast(true);
        trackEvent('wallet_address_copied', { address });
        setTimeout(() => setCopied(false), 2000);
        setTimeout(() => setShowToast(false), 3000);
      }).catch(() => {
        fallbackCopy(address);
      });
    } else {
      fallbackCopy(address);
    }
  }, [settings?.wallet_address]);

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setShowToast(true);
      trackEvent('wallet_address_copied', { address: text });
      setTimeout(() => setCopied(false), 2000);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert(text);
    }
  };

  const handleSelectAmount = (amt: number | 'custom') => {
    setSelectedAmount(amt);
    trackEvent('donation_amount_selected', { amount: amt });
  };

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setConfirmError(lang === 'ar' ? 'يرجى إدخال رقم العملية (Transaction Hash)' : 'Please enter Transaction Hash');
      return;
    }

    setIsSubmittingConfirm(true);
    setConfirmError('');

    const finalAmount = selectedAmount === 'custom'
      ? parseFloat(customAmount) || 0
      : selectedAmount;

    try {
      const res = await fetch('/api/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: txHash,
          amount: finalAmount,
          currency: settings?.currency || 'USDT',
          network: settings?.network || 'TRON (TRC-20)',
          donor_name: donorName,
          donor_email: donorEmail,
          donor_message: donorMessage
        })
      });

      if (res.ok) {
        setConfirmSuccess(true);
        trackEvent('donation_confirmation_submitted', { amount: finalAmount });
      } else {
        const err = await res.json();
        setConfirmError(err.error || (lang === 'ar' ? 'حدث خطأ في إرسال البيانات' : 'Failed to submit info'));
      }
    } catch (err) {
      setConfirmError(lang === 'ar' ? 'خطأ في الاتصال بالشبكة' : 'Network connection error');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  if (!isOpen) return null;

  const currency = settings?.currency || 'USDT';
  const network = settings?.network || 'TRON (TRC-20)';
  const walletAddress = settings?.wallet_address || 'TSC67u84nbzYSiKoDLBnVB3csFXLBFYUy6';
  const title = lang === 'ar'
    ? (settings?.title_ar || t.donate_title)
    : (settings?.title_en || t.donate_title);
  const description = lang === 'ar'
    ? (settings?.description_ar || t.donate_subtitle)
    : (settings?.description_en || t.donate_subtitle);
  const presetAmounts = settings?.preset_amounts || [5, 10, 25, 50, 100];
  const explorerUrlTemplate = settings?.explorer_url_template || 'https://tronscan.org/#/address/{address}';
  const explorerUrl = explorerUrlTemplate.replace('{address}', walletAddress);

  const displayAmount = selectedAmount === 'custom'
    ? (customAmount ? `${customAmount} ${currency}` : `${currency}`)
    : `${selectedAmount} ${currency}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-primary-950/70 backdrop-blur-md transition-all animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="donation-modal-title"
    >
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-primary-900 text-gold-300 px-6 py-3 rounded-2xl shadow-2xl border border-gold-400/30 flex items-center gap-2 font-bold text-sm animate-bounce">
          <Check className="w-5 h-5 text-gold-400" />
          <span>{t.donate_address_copied}</span>
        </div>
      )}

      <div
        ref={modalRef}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gold-200/50 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] relative transform transition-all"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 text-white relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 rtl:left-auto rtl:right-4 p-2 text-primary-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            aria-label={t.close}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-inner">
              <Heart className="w-5 h-5 fill-gold-400 text-gold-400 animate-pulse" />
            </div>
            <div>
              <h2 id="donation-modal-title" className="text-lg sm:text-xl font-bold text-white">
                {title}
              </h2>
              <p className="text-xs text-gold-300/90 font-medium">
                {t.donate_any_amount}
              </p>
            </div>
          </div>

          <p className="text-xs text-primary-100/80 leading-relaxed mt-2 line-clamp-3 sm:line-clamp-none">
            {description}
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveTab('donate')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'donate'
                  ? 'bg-gold-500 text-primary-950 shadow-md'
                  : 'bg-white/10 text-primary-100 hover:bg-white/15'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{t.donate_select_method}</span>
            </button>
            <button
              onClick={() => setActiveTab('confirm')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'confirm'
                  ? 'bg-gold-500 text-primary-950 shadow-md'
                  : 'bg-white/10 text-primary-100 hover:bg-white/15'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{t.donate_confirm_prompt}</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-gray-50/50">
          {isLoadingSettings ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gold-600" />
              <p className="text-xs font-bold">{t.loading}</p>
            </div>
          ) : activeTab === 'donate' ? (
            <>
              {/* Network Badge */}
              <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="text-xs font-bold text-gray-700">{currency}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-primary-50 text-primary-800 rounded-full border border-primary-200/60">
                    {network}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  Crypto Transfer
                </span>
              </div>

              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  {t.donate_amount_preset}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {presetAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectAmount(amt)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                        selectedAmount === amt
                          ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400 hover:bg-gold-50/30'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSelectAmount('custom')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      selectedAmount === 'custom'
                        ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400'
                    }`}
                  >
                    {t.donate_custom_amount}
                  </button>
                </div>

                {selectedAmount === 'custom' && (
                  <div className="mt-3">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder={lang === 'ar' ? 'أدخل المبلغ بالدولار ($)' : 'Enter amount in USD ($)'}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Transfer Instruction */}
              <div className="p-3 bg-gold-50/80 rounded-2xl border border-gold-200 text-center">
                <p className="text-xs font-bold text-primary-950">
                  {t.donate_transfer_instruction
                    .replace('{amount}', displayAmount)
                    .replace('{currency}', '')}
                </p>
              </div>

              {/* Wallet Address & QR Code Box */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <QRCodeDisplay
                    value={walletAddress}
                    size={130}
                    qrImageUrl={settings?.qr_code}
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 w-full space-y-2 text-center sm:text-right rtl:sm:text-right ltr:sm:text-left min-w-0">
                    <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">
                      {t.donate_wallet_address} ({network})
                    </span>

                    {/* Word-break address container */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs text-primary-950 font-bold break-all selection:bg-gold-200 selection:text-primary-950 shadow-inner dir-ltr text-left">
                      {walletAddress}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary-900 text-white hover:bg-primary-800'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{t.donate_address_copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gold-400" />
                          <span>{t.donate_copy_address}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Blockchain Explorer Link */}
                <div className="pt-2 border-t border-gray-100 flex justify-center">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary-800 hover:text-gold-700 font-bold transition-colors"
                  >
                    <span>{t.donate_explorer_link}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-900">
                    {t.donate_warning_title
                      .replace('{currency}', currency)
                      .replace('{network}', network)}
                  </p>
                  <p className="text-amber-800/90 leading-relaxed">
                    {t.donate_warning_desc}
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Confirmation Form Tab */
            <form onSubmit={handleSubmitConfirmation} className="space-y-4">
              <div className="p-3 bg-primary-50 rounded-2xl border border-primary-100 text-xs text-primary-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-primary-700 flex-shrink-0 mt-0.5" />
                <p>{t.donate_confirm_desc}</p>
              </div>

              {confirmSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-emerald-900">
                    {t.donate_confirm_success}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmSuccess(false);
                      setTxHash('');
                      setActiveTab('donate');
                    }}
                    className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors"
                  >
                    {t.back}
                  </button>
                </div>
              ) : (
                <>
                  {confirmError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                      {confirmError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.donate_tx_hash} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 7f8a9b..."
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-primary-500 outline-none dir-ltr text-left bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t.donate_donor_name}
                      </label>
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t.donate_donor_email}
                      </label>
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.donate_donor_message}
                    </label>
                    <textarea
                      rows={3}
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingConfirm}
                    className="w-full py-3 bg-primary-900 text-white rounded-2xl font-bold text-xs hover:bg-primary-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingConfirm ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-gold-400" />
                    )}
                    <span>{t.donate_submit_confirm}</span>
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
