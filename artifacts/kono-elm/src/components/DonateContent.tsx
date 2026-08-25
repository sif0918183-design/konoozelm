'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Share2,
  Send,
  Loader2,
  Server,
  BookOpen,
  Zap,
  Globe,
  Award,
  Info
} from 'lucide-react';
import { translations, type Language } from '@/lib/translations';
import QRCodeDisplay from './QRCodeDisplay';
import { DonationSettings } from './DonationModal';

interface DonateContentProps {
  lang: Language;
  initialSettings?: DonationSettings | null;
}

export default function DonateContent({ lang, initialSettings = null }: DonateContentProps) {
  const t = translations[lang];
  const [settings, setSettings] = useState<DonationSettings | null>(initialSettings);
  const [isLoading, setIsLoading] = useState(!initialSettings);
  // Card Payment States (Starts at $15)
  const [cardSelectedAmount, setCardSelectedAmount] = useState<number | 'custom'>(25);
  const [cardCustomAmount, setCardCustomAmount] = useState<string>('');

  // Crypto Payment States (Starts at $5)
  const [cryptoSelectedAmount, setCryptoSelectedAmount] = useState<number | 'custom'>(25);
  const [cryptoCustomAmount, setCryptoCustomAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // PayGate Checkout State
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [returnStatus, setReturnStatus] = useState<'success' | 'cancelled' | null>(null);

  // Confirmation Form State
  const [txHash, setTxHash] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Check URL query parameters for return status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      if (status === 'success' || status === 'paid') {
        setReturnStatus('success');
      } else if (status === 'cancelled' || status === 'cancel') {
        setReturnStatus('cancelled');
      }
    }
  }, []);

  useEffect(() => {
    if (!settings) {
      setIsLoading(true);
      fetch('/api/donations/settings')
        .then((res) => res.json())
        .then((data) => setSettings(data))
        .catch((err) => console.error('Error loading donation settings:', err))
        .finally(() => setIsLoading(false));
    }
  }, [settings]);

  const currency = settings?.currency || 'USDT';
  const network = settings?.network || 'TRON (TRC-20)';
  const walletAddress = settings?.wallet_address || 'TSC67u84nbzYSiKoDLBnVB3csFXLBFYUy6';
  const presetAmounts = settings?.preset_amounts || [5, 10, 25, 50, 100];
  const cardPresetAmounts = [15, 25, 50, 100];
  const explorerUrlTemplate = settings?.explorer_url_template || 'https://tronscan.org/#/address/{address}';
  const explorerUrl = explorerUrlTemplate.replace('{address}', walletAddress);

  const displayCryptoAmount = cryptoSelectedAmount === 'custom'
    ? (cryptoCustomAmount ? `${cryptoCustomAmount} ${currency}` : `${currency}`)
    : `${cryptoSelectedAmount} ${currency}`;

  const handlePayGateCheckout = async () => {
    setCheckoutError('');
    const finalAmount = cardSelectedAmount === 'custom'
      ? parseFloat(cardCustomAmount) || 0
      : cardSelectedAmount;

    if (!finalAmount || finalAmount <= 0) {
      setCheckoutError(lang === 'ar' ? 'يرجى تحديد مبلغ التبرع' : 'Please select or enter a donation amount');
      return;
    }

    if (finalAmount < 15) {
      setCheckoutError(lang === 'ar' ? 'أقل مبلغ يقبله هذا النوع من نظام التحويل 15$' : 'Minimum donation amount for card transfer is $15');
      return;
    }

    setIsCreatingCheckout(true);

    try {
      const res = await fetch('/api/donations/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donor_name: donorName,
          donor_email: donorEmail,
          donor_message: donorMessage
        })
      });

      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setCheckoutError(data.error || (lang === 'ar' ? 'فشل إنشاء عملية الدفع' : 'Failed to create checkout session'));
        setIsCreatingCheckout(false);
      }
    } catch (err) {
      setCheckoutError(lang === 'ar' ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
      setIsCreatingCheckout(false);
    }
  };

  const handleCopyAddress = useCallback(() => {
    if (!walletAddress) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setCopied(true);
        setShowToast(true);
        setTimeout(() => setCopied(false), 2000);
        setTimeout(() => setShowToast(false), 3000);
      });
    }
  }, [walletAddress]);

  const handleShare = (platform: string) => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : 'https://hudalibrary.com/donate';
    const shareText = encodeURIComponent(t.donate_share_text);
    const shareUrlEncoded = encodeURIComponent(pageUrl);

    let url = '';
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrlEncoded}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${shareUrlEncoded}&text=${shareText}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(t.donate_share_title)}&body=${shareText}%20${shareUrlEncoded}`;
        break;
      case 'copy':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pageUrl);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        }
        return;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      setConfirmError(lang === 'ar' ? 'يرجى إدخال رقم العملية (Transaction Hash)' : 'Please enter Transaction Hash');
      return;
    }

    setIsSubmittingConfirm(true);
    setConfirmError('');

    const finalAmount = cryptoSelectedAmount === 'custom'
      ? parseFloat(cryptoCustomAmount) || 0
      : cryptoSelectedAmount;

    try {
      const res = await fetch('/api/donations/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: txHash,
          amount: finalAmount,
          currency,
          network,
          donor_name: donorName,
          donor_email: donorEmail,
          donor_message: donorMessage
        })
      });

      if (res.ok) {
        setConfirmSuccess(true);
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

  return (
    <div className="space-y-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] bg-primary-900 text-gold-300 px-6 py-3 rounded-2xl shadow-2xl border border-gold-400/30 flex items-center gap-2 font-bold text-sm animate-bounce">
          <Check className="w-5 h-5 text-gold-400" />
          <span>{t.donate_address_copied}</span>
        </div>
      )}

      {/* Hero Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-400 shadow-inner">
            <Heart className="w-7 h-7 fill-gold-400 text-gold-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-gold-300">
              {lang === 'ar' ? (settings?.title_ar || t.donate_title) : (settings?.title_en || t.donate_title)}
            </h2>
            <p className="text-xs sm:text-sm text-gold-200/90 font-medium mt-1">
              {t.donate_any_amount}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-3xl">
          {lang === 'ar' ? (settings?.description_ar || t.donate_subtitle) : (settings?.description_en || t.donate_subtitle)}
        </p>

        {/* Share Buttons */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-gold-300 flex items-center gap-1.5 me-2">
            <Share2 className="w-4 h-4" />
            {lang === 'ar' ? 'شارك الصفحة:' : 'Share Page:'}
          </span>
          <button
            onClick={() => handleShare('facebook')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
          >
            Facebook
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-xs font-bold transition-all text-white"
          >
            WhatsApp
          </button>
          <button
            onClick={() => handleShare('telegram')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-600/80 hover:bg-sky-600 text-xs font-bold transition-all text-white"
          >
            Telegram
          </button>
          <button
            onClick={() => handleShare('email')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all"
          >
            Email
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="px-3.5 py-1.5 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 text-xs font-bold transition-all flex items-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? (lang === 'ar' ? 'تم نسخ الرابط' : 'Link Copied') : (lang === 'ar' ? 'نسخ الرابط' : 'Copy Link')}
          </button>
        </div>
      </div>

      {/* Return Status Banners */}
      {returnStatus === 'success' && (
        <div className="p-6 bg-emerald-500/15 border-2 border-emerald-500 rounded-3xl text-emerald-900 flex items-center gap-4 shadow-lg animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-emerald-950">
              {t.donate_confirm_success}
            </h3>
            <p className="text-xs text-emerald-800 mt-1">
              {t.donate_payment_success}
            </p>
          </div>
        </div>
      )}

      {returnStatus === 'cancelled' && (
        <div className="p-5 bg-amber-500/15 border-2 border-amber-500 rounded-3xl text-amber-900 flex items-center gap-4 shadow-lg animate-fadeIn">
          <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-950">
              {t.donate_payment_cancelled}
            </p>
          </div>
        </div>
      )}

      {/* Main Donation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Two Distinct Cards */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Card: Cards & Digital Wallets via PayGate */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-primary-950 flex items-center gap-2">
                <Heart className="w-5 h-5 fill-gold-500 text-gold-500" />
                <span>{t.donate_paygate_btn}</span>
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Visa / Mastercard / Apple Pay / Google Pay
              </span>
            </div>

            {/* Preset Amount Selector for Cards */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                {t.donate_amount_preset}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {cardPresetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setCardSelectedAmount(amt);
                      setCheckoutError('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      cardSelectedAmount === amt
                        ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCardSelectedAmount('custom');
                    setCheckoutError('');
                  }}
                  className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                    cardSelectedAmount === 'custom'
                      ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400'
                  }`}
                >
                  {t.donate_custom_amount}
                </button>
              </div>

              {cardSelectedAmount === 'custom' && (
                <div className="mt-3 space-y-1">
                  <input
                    type="number"
                    min="15"
                    step="any"
                    placeholder={lang === 'ar' ? 'أدخل المبلغ بالدولار ($) - 15$ على الأقل' : 'Enter amount in USD ($) - min $15'}
                    value={cardCustomAmount}
                    onChange={(e) => {
                      setCardCustomAmount(e.target.value);
                      const num = parseFloat(e.target.value);
                      if (num && num < 15) {
                        setCheckoutError(lang === 'ar' ? 'أقل مبلغ يقبله هذا النوع من نظام التحويل 15$' : 'Minimum donation amount for card transfer is $15');
                      } else {
                        setCheckoutError('');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  />
                </div>
              )}
            </div>

            {/* Primary PayGate Payment Action Button */}
            <div className="space-y-3 pt-2">
              {checkoutError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                  {checkoutError}
                </div>
              )}

              <button
                type="button"
                onClick={handlePayGateCheckout}
                disabled={isCreatingCheckout}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 hover:from-gold-400 hover:to-gold-500 text-primary-950 font-bold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 border border-gold-300 scale-100 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              >
                {isCreatingCheckout ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.donate_processing_redirect}</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 fill-primary-950" />
                    <span>{t.donate_paygate_btn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bottom Card: Direct Crypto Transfer */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-primary-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>USDT {network} Crypto Transfer</span>
              </h3>
              <span className="text-xs font-bold px-3 py-1 bg-primary-50 text-primary-900 rounded-full border border-primary-200">
                {currency}
              </span>
            </div>

            {/* Preset Amount Selector for Crypto */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                {t.donate_amount_preset}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCryptoSelectedAmount(amt)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      cryptoSelectedAmount === amt
                        ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCryptoSelectedAmount('custom')}
                  className={`py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                    cryptoSelectedAmount === 'custom'
                      ? 'bg-primary-900 text-white border-primary-900 shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gold-400'
                  }`}
                >
                  {t.donate_custom_amount}
                </button>
              </div>

              {cryptoSelectedAmount === 'custom' && (
                <div className="mt-3">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder={lang === 'ar' ? 'أدخل المبلغ بالدولار ($)' : 'Enter amount in USD ($)'}
                    value={cryptoCustomAmount}
                    onChange={(e) => setCryptoCustomAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  />
                </div>
              )}
            </div>

            <div className="p-3.5 bg-gold-50 rounded-2xl border border-gold-200 text-center">
              <p className="text-xs sm:text-sm font-bold text-primary-950">
                {t.donate_transfer_instruction
                  .replace('{amount}', displayCryptoAmount)
                  .replace('{currency}', '')}
              </p>
            </div>

            {/* QR Code and Wallet Box */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gray-50/80 rounded-2xl border border-gray-200">
              <QRCodeDisplay
                value={walletAddress}
                size={140}
                qrImageUrl={settings?.qr_code}
                className="flex-shrink-0"
              />

              <div className="flex-1 w-full space-y-3 min-w-0">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">
                  {t.donate_wallet_address} ({network})
                </span>

                <div className="p-3 bg-white rounded-xl border border-gray-300 font-mono text-xs text-primary-950 font-bold break-all dir-ltr text-left shadow-inner">
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
            <div className="text-center pt-2">
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

            {/* Warning Box */}
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
          </div>

          {/* Optional Confirmation Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-gold-600" />
              <h3 className="text-base font-bold text-primary-950">
                {t.donate_confirm_prompt}
              </h3>
            </div>
            <p className="text-xs text-gray-600">{t.donate_confirm_desc}</p>

            {confirmSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-emerald-900">
                  {t.donate_confirm_success}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitConfirmation} className="space-y-3 pt-2">
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
                    rows={2}
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingConfirm}
                  className="w-full py-3 bg-primary-900 text-white rounded-xl font-bold text-xs hover:bg-primary-800 transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isSubmittingConfirm ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-gold-400" />
                  )}
                  <span>{t.donate_submit_confirm}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Why Support Matters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-200/80 space-y-6 sticky top-24">
            <h3 className="text-xl font-bold text-primary-950 border-b border-gray-100 pb-4 font-amiri">
              {t.donate_why_support}
            </h3>

            <div className="space-y-5">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary-50 text-primary-900 rounded-2xl flex-shrink-0 border border-primary-100">
                  <Server className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">
                    {t.donate_reason_1}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    غصص الاستضافة والخوادم البنية التحتية لتوفير الخدمة على مدار الساعة بدون انقطاع.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary-50 text-primary-900 rounded-2xl flex-shrink-0 border border-primary-100">
                  <BookOpen className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">
                    {t.donate_reason_2}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    تأمين أرشيف المخطوطات والكتب النادرة وحفظها من الضياع والتلف الرقمي.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary-50 text-primary-900 rounded-2xl flex-shrink-0 border border-primary-100">
                  <Globe className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">
                    {t.donate_reason_3}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    استمرار إتاحة المحتوى مجانًا لطلاب العلم والباحثين والقراء دون أي قيود أو اشتراكات.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary-50 text-primary-900 rounded-2xl flex-shrink-0 border border-primary-100">
                  <Zap className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">
                    {t.donate_reason_4}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    تطوير تقنيات محركات البحث السريعة والتصفح المباشر دون الحاجة لتحميل ملفات ضخمة.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="p-3 bg-primary-50 text-primary-900 rounded-2xl flex-shrink-0 border border-primary-100">
                  <Award className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-1">
                    {t.donate_reason_5}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    إضافة خدمات حديثة وتسهيل حفظ علامات القراءة وتطبيق القراءة السريعة والأوفلاين.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary-950 text-white rounded-2xl border border-gold-400/30 text-center space-y-2">
              <p className="text-xs font-bold text-gold-300">
                🌱 صدقة جارية ونفع متعدٍّ
              </p>
              <p className="text-[11px] text-primary-100/80 leading-relaxed">
                قال رسول الله ﷺ: «إِذَا مَاتَ الإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلا مِنْ ثَلاثٍ: إِلا مِنْ صَدَقَةٍ جَارِيَةٍ، أَوْ عِلْمٍ يُنْتَفَعُ بِهِ...»
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
