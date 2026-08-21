export interface DonationSettingsData {
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

export const DEFAULT_DONATION_SETTINGS: DonationSettingsData = {
  enabled: true,
  show_button: true,
  wallet_address: 'TY1234567890HudaLibraryTRC20Address',
  currency: 'USDT',
  network: 'TRON (TRC-20)',
  qr_code: '',
  title_ar: 'ساهم في استمرار مكتبة الهدى',
  title_en: 'Support Huda Library',
  description_ar: 'مكتبة الهدى مشروع معرفي يهدف إلى إتاحة المصادر الإسلامية والكتب والمخطوطات للباحثين وطلاب العلم والقراء. دعمك يساعدنا على استمرار تشغيل المكتبة وتطويرها وإتاحة محتواها.',
  description_en: 'Huda Library is a knowledge project aiming to make Islamic resources, books, and manuscripts accessible to researchers, students, and readers. Your support helps us continue operating, developing, and providing free access to content.',
  preset_amounts: [5, 10, 25, 50, 100],
  explorer_url_template: 'https://tronscan.org/#/address/{address}'
};
