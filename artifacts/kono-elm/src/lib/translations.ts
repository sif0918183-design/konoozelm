export type Language = 'ar' | 'en';

export interface TranslationKeys {
  title: string;
  subtitle: string;
  search_placeholder: string;
  search_button: string;
  loading: string;
  no_results: string;
  try_another_word: string;
  results_found: string;
  back_to_home: string;
  featured_categories: string;
  read_more: string;
  offline_notice: string;
  footer_text: string;
  rights_reserved: string;
  load_more: string;
  continue_reading: string;
  recent_books: string;
  show_more: string;
  show_less: string;
  download: string;
  read_now: string;
  category: string;
  author: string;
  parts: string;
  no_books_in_category: string;
  home: string;
  language_switcher: string;
  error_search: string;
  search_start_title: string;
  search_start_desc: string;
  publisher: string;
  multi_part: string;
  available_offline: string;
  unpin: string;
  pin: string;
  remove: string;
  view_full_history: string;
  ready_for_offline: string;
  pwa_install_title: string;
  pwa_install_desc: string;
  pwa_install_btn: string;
  pwa_cancel: string;
  page_of: string; // e.g. "Page {current} of {total}"
  select_part_read: string;
  select_part_download: string;
  close: string;
  loading_book: string;
  preparing_download: string;
  dont_close_page: string;
  book_label: string;

  // Donation Keys
  donate_button_text: string;
  donate_title: string;
  donate_subtitle: string;
  donate_any_amount: string;
  donate_select_method: string;
  donate_amount_preset: string;
  donate_custom_amount: string;
  donate_transfer_instruction: string;
  donate_wallet_address: string;
  donate_copy_address: string;
  donate_address_copied: string;
  donate_warning_title: string;
  donate_warning_desc: string;
  donate_explorer_link: string;
  donate_confirm_prompt: string;
  donate_confirm_desc: string;
  donate_tx_hash: string;
  donate_donor_name: string;
  donate_donor_email: string;
  donate_donor_message: string;
  donate_submit_confirm: string;
  donate_confirm_success: string;
  donate_why_support: string;
  donate_reason_1: string;
  donate_reason_2: string;
  donate_reason_3: string;
  donate_reason_4: string;
  donate_reason_5: string;
  donate_page_meta_title: string;
  donate_page_meta_desc: string;
  donate_share_title: string;
  donate_share_text: string;

  // Admin Keys
  admin_title: string;
  admin_main_site: string;
  admin_search_archive: string;
  admin_categories_suggestions: string;
  admin_add_category: string;
  admin_cancel: string;
  admin_save_category: string;
  admin_generate_ai: string;
  admin_smart_suggestions: string;
  admin_authors_management: string;
  admin_add_author: string;
  admin_save_author: string;
  admin_seo_preparation: string;
  admin_seo_meta_title: string;
  admin_slug: string;
  admin_category: string;
  admin_author: string;
  admin_parts_count: string;
  admin_seo_description: string;
  admin_save_and_publish: string;
  admin_update_data: string;
  admin_smart_system_ready: string;
  admin_smart_system_desc: string;
  admin_suggested_books: string;
  admin_found_books: string;
  admin_search_more: string;
  admin_analyzing: string;
  admin_no_suggestions: string;
  admin_reject_selected: string;
  admin_selected_count: string;
  admin_add_selected: string;
  admin_processing: string;
  admin_ai_magic_working: string;
  admin_ai_magic_desc: string;
  admin_added_already: string;
  admin_rejected: string;
  admin_new: string;
  admin_tab_arabic: string;
  admin_tab_english: string;
  admin_language: string;
  admin_select_lang: string;
  admin_desc_limit_hint: string;
  admin_cat_placeholder: string;
  admin_cat_desc_placeholder: string;
  admin_author_name_placeholder: string;
  admin_author_bio_placeholder: string;
  admin_success_save_book: string;
  admin_error_save_book: string;
  admin_success_save_cat: string;
  admin_error_save_cat: string;
  admin_success_save_author: string;
  admin_error_save_author: string;
  admin_bulk_success: string;
  admin_bulk_partial_error: string;
  admin_bulk_error: string;
  admin_conn_error: string;
  admin_donations: string;
  admin_donation_settings: string;
  admin_donations_list: string;
  admin_donation_enabled: string;
  admin_show_donation_button: string;
  admin_wallet_address: string;
  admin_network: string;
  admin_currency: string;
  admin_qr_code_url: string;
  admin_preset_amounts: string;
  admin_preview_modal: string;
  admin_save_settings: string;
  admin_total_donations: string;
  admin_pending_donations: string;
  admin_verified_donations: string;
  admin_status_pending: string;
  admin_status_verified: string;
  admin_status_rejected: string;
  admin_mark_verified: string;
  admin_mark_rejected: string;
  admin_confirm_status_change: string;
  admin_explorer_template: string;
  admin_title_ar: string;
  admin_title_en: string;
  admin_desc_ar: string;
  admin_desc_en: string;

  error_no_pdf: string;
  error_pdf_lib: string;
  error_pdf_404: string;
  error_pdf_general: string;
  confirm_remove_recent: string;
  edu_notice: string;
  edu_title: string;
  edu_quote: string;
  edu_desc: string;
  did_you_know: string;
  did_you_know_desc: string;
  cancel_and_return: string;
  back: string;
  night_mode: string;
  download_pdf: string;
  sorry_error: string;
  security_restriction_msg: string;
  preparing_book: string;
  preparation_progress: string;
  of_label: string;
  history_title: string;
  history_desc: string;
  history_search: string;
  history_total: string;
  history_empty: string;
  history_empty_desc: string;
  history_last_read: string;
  history_resume: string;
  back_to_library: string;
  completion_rate: string;
  global_digital_library: string;
  search_header_title: string;
  search_header_subtitle: string;
  pin_offline_hint: string;
  about_us: string;
  contact_us: string;
  privacy_policy: string;
  terms_of_use: string;
  copyright_policy: string;
}

export const translations: Record<Language, TranslationKeys> = {
  ar: {
    title: 'مكتبة الهدى',
    subtitle: 'الموسوعة الإلكترونية الشاملة للكتب والرسائل والمخطوطات الإسلامية',
    search_placeholder: 'ابحث بالعنوان، المؤلف، أو الموضوع...',
    search_button: 'بحث',
    loading: 'جاري التحميل...',
    no_results: 'لم يتم العثور على نتائج',
    try_another_word: 'جرب البحث بكلمة أخرى',
    results_found: 'تم العثور على {count} كتاب',
    back_to_home: 'العودة للرئيسية',
    featured_categories: 'أقسام الموسوعة',
    read_more: 'اقرأ المزيد',
    offline_notice: '📚 يتم حفظ موضع قراءتك تلقائيًا لتيسير استكمال المطالعة من حيث توقفت',
    footer_text: 'مشروع غير ربحي يهدف لتيسير الوصول للكتب الإسلامية القيمة والمخطوطات النادرة من أرشيف المكتبات العالمية.',
    rights_reserved: 'جميع الحقوق محفوظة © {year} - مكتبة الهدى',
    load_more: 'تحميل المزيد',
    continue_reading: 'تابع القراءة',
    recent_books: 'الكتب الأخيرة',
    show_more: 'عرض المزيد',
    show_less: 'عرض أقل',
    download: 'تحميل',
    read_now: 'قراءة',
    category: 'التصنيف',
    author: 'المؤلف',
    parts: 'الأجزاء',
    no_books_in_category: 'لا توجد كتب في هذا التصنيف حالياً',
    home: 'الرئيسية',
    language_switcher: 'English',
    error_search: 'حدث خطأ في البحث',
    search_start_title: 'ابحث في موسوعتنا الإسلامية',
    search_start_desc: 'اكتب اسم الكتاب أو المؤلف للبدء',
    publisher: 'الناشر',
    multi_part: 'متعدد الأجزاء ({count})',
    available_offline: 'متوفر بدون اتصال',
    unpin: 'إلغاء التثبيت',
    pin: 'تثبيت',
    remove: 'إزالة',
    view_full_history: 'عرض السجل الكامل',
    ready_for_offline: 'جاهز للقراءة بدون إنترنت',
    pwa_install_title: 'تثبيت التطبيق',
    pwa_install_desc: 'تصفح واقرأ آلاف الكتب الإسلامية بسهولة من شاشتك الرئيسية',
    pwa_install_btn: 'تثبيت الآن',
    pwa_cancel: 'ليس الآن',
    page_of: 'الصفحة {current} من {total}',
    select_part_read: 'اختر الجزء للقراءة',
    select_part_download: 'اختر الجزء للتحميل',
    close: 'إغلاق',
    loading_book: 'جاري تحميل الكتاب...',
    preparing_download: 'اكتمل التحضير، سيبدأ التحميل الآن...',
    dont_close_page: 'يرجى عدم إغلاق هذه الصفحة حتى يكتمل الشريط',
    book_label: 'الكتاب',

    // Donation Strings
    donate_button_text: '❤️ ادعم مكتبة الهدى',
    donate_title: 'ساهم في استمرار مكتبة الهدى',
    donate_subtitle: 'مكتبة الهدى مشروع معرفي يهدف إلى إتاحة المصادر الإسلامية والكتب والمخطوطات للباحثين وطلاب العلم والقراء. دعمك يساعدنا على استمرار تشغيل المكتبة وتطويرها وإتاحة محتواها.',
    donate_any_amount: 'يمكنك التبرع بأي مبلغ يناسبك.',
    donate_select_method: 'اختر طريقة التبرع',
    donate_amount_preset: 'مبلغ التبرع المقترح',
    donate_custom_amount: 'مبلغ آخر',
    donate_transfer_instruction: 'حوّل {amount} {currency} إلى العنوان التالي:',
    donate_wallet_address: 'عنوان المحفظة',
    donate_copy_address: 'نسخ عنوان المحفظة',
    donate_address_copied: 'تم نسخ عنوان المحفظة ✓',
    donate_warning_title: '⚠️ أرسل {currency} عبر شبكة {network} فقط.',
    donate_warning_desc: 'تأكد من اختيار الشبكة الصحيحة قبل إرسال التبرع. معاملات العملات الرقمية قد تكون غير قابلة للاسترجاع.',
    donate_explorer_link: 'عرض العنوان على Blockchain Explorer',
    donate_confirm_prompt: 'هل تبرعت بالفعل؟',
    donate_confirm_desc: 'يمكنك إرسال رقم العملية Transaction Hash لمساعدتنا على تسجيل التبرع.',
    donate_tx_hash: 'رقم العملية (Transaction Hash)',
    donate_donor_name: 'الاسم (اختياري)',
    donate_donor_email: 'البريد الإلكتروني (اختياري)',
    donate_donor_message: 'رسالة أو كلمة تشجيع (اختياري)',
    donate_submit_confirm: 'إرسال تأكيد التبرع',
    donate_confirm_success: 'تم إرسال معلومات التبرع بنجاح، شكرًا لدعمك.',
    donate_why_support: 'لماذا دعمك يهمنا؟',
    donate_reason_1: 'استمرار تشغيل وتطوير المكتبة الرقمية',
    donate_reason_2: 'استضافة المحتوى وحفظ المخطوطات والكتب النادرة',
    donate_reason_3: 'رقمنة المصادر الإسلامية وإتاحتها مجاناً للجميع',
    donate_reason_4: 'تطوير المنصة وتحسين سرعة الوصول والبحث',
    donate_reason_5: 'تحسين تجربة القراءة وتوفير الخدمات الحديثة للباحثين',
    donate_page_meta_title: 'ادعم مكتبة الهدى | التبرع للمكتبة الرقمية',
    donate_page_meta_desc: 'مساهمتك تمكننا من إتاحة آلاف الكتب والمخطوطات الإسلامية مجانًا للباحثين والقراء حول العالم.',
    donate_share_title: 'ادعم مكتبة الهدى الرقمية',
    donate_share_text: 'ساهم في دعم مكتبة الهدى واستمرار إتاحة الكتب والمخطوطات الإسلامية مجاناً للجميع.',

    // Admin Strings
    admin_title: 'لوحة تحكم مكتبة الهدى',
    admin_main_site: 'الموقع الرئيسي',
    admin_search_archive: 'البحث في المكتبة العالمية (Archive)',
    admin_categories_suggestions: 'إدارة التصنيفات والاقتراحات الذكية',
    admin_add_category: 'إضافة تصنيف',
    admin_cancel: 'إلغاء',
    admin_save_category: 'حفظ التصنيف',
    admin_generate_ai: 'توليد آلي (OpenAI)',
    admin_smart_suggestions: 'اقتراح كتب ذكية',
    admin_authors_management: 'إدارة المؤلفين',
    admin_add_author: 'إضافة مؤلف',
    admin_save_author: 'حفظ المؤلف',
    admin_seo_preparation: 'تجهيز صفحة SEO احترافية',
    admin_seo_meta_title: 'العنوان (SEO Meta Title)',
    admin_slug: 'الرابط (Slug)',
    admin_category: 'التصنيف',
    admin_author: 'المؤلف',
    admin_parts_count: 'عدد الأجزاء',
    admin_seo_description: 'وصف الكتاب (SEO Content)',
    admin_save_and_publish: 'حفظ ونشر الصفحة',
    admin_update_data: 'تحديث البيانات',
    admin_smart_system_ready: 'النظام الذكي جاهز',
    admin_smart_system_desc: 'استخدم زر "اقتراح كتب ذكية" لإضافة محتوى احترافي بسرعة فائقة بالاعتماد على الذكاء الاصطناعي.',
    admin_suggested_books: 'كتب مقترحة لتصنيف: {category}',
    admin_found_books: 'تم جلب {count} كتاباً من Archive.org.',
    admin_search_more: 'ابحث عن كتب أخرى لهذا التصنيف...',
    admin_analyzing: 'جاري تحليل مئات الكتب وترتيبها بالذكاء الاصطناعي... يرجى الانتظار',
    admin_no_suggestions: 'لم يتم العثور على اقتراحات جديدة لهذا التصنيف حالياً.',
    admin_reject_selected: 'استبعد المختارة',
    admin_selected_count: 'تم اختيار {count} كتاباً',
    admin_add_selected: 'إضافة الكتب المختارة للنظام',
    admin_processing: 'جاري المعالجة...',
    admin_ai_magic_working: 'جاري العمل على سحر الذكاء الاصطناعي...',
    admin_ai_magic_desc: 'نقوم الآن بجلب أفضل النسخ، توليد محتوى SEO احترافي، وبناء الصفحات آلياً. يرجى عدم إغلاق النافذة.',
    admin_added_already: 'مضاف مسبقاً',
    admin_rejected: 'مستبعد',
    admin_new: 'جديد',
    admin_tab_arabic: 'المحتوى العربي',
    admin_tab_english: 'English Content',
    admin_language: 'اللغة',
    admin_select_lang: 'اختر اللغة',
    admin_desc_limit_hint: 'يفضل أن يكون الوصف بين 150 إلى 300 كلمة لضمان أفضل أرشفة.',
    admin_cat_placeholder: 'اسم التصنيف (مثال: كتب الحديث)',
    admin_cat_desc_placeholder: 'وصف التصنيف لـ SEO',
    admin_author_name_placeholder: 'اسم المؤلف الكامل',
    admin_author_bio_placeholder: 'نبذة مختصرة عن المؤلف لصفحة SEO',
    admin_success_save_book: 'تم حفظ الكتاب بنجاح',
    admin_error_save_book: 'خطأ في الحفظ: تأكد من إعداد الجداول في Supabase',
    admin_success_save_cat: 'تمت إضافة التصنيف',
    admin_error_save_cat: 'خطأ في حفظ التصنيف',
    admin_success_save_author: 'تمت إضافة المؤلف',
    admin_error_save_author: 'خطأ في حفظ المؤلف',
    admin_bulk_success: 'تمت إضافة جميع الكتب بنجاح',
    admin_bulk_partial_error: 'تمت الإضافة مع وجود أخطاء في {count} كتب. راجع السجلات.',
    admin_bulk_error: 'فشل الإضافة الجماعية (خطأ خادم)',
    admin_conn_error: 'خطأ في الاتصال',
    admin_donations: 'التبرعات',
    admin_donation_settings: 'إعدادات التبرعات',
    admin_donations_list: 'سجل التبرعات',
    admin_donation_enabled: 'تفعيل نظام التبرعات',
    admin_show_donation_button: 'إظهار زر التبرع الثابت',
    admin_wallet_address: 'عنوان المحفظة العام (Public Wallet Address)',
    admin_network: 'الشبكة (Network)',
    admin_currency: 'العملة (Currency)',
    admin_qr_code_url: 'صورة QR Code (اختياري)',
    admin_preset_amounts: 'المبالغ المقترحة (مفصولة بفواصل)',
    admin_preview_modal: 'معاينة نافذة التبرع',
    admin_save_settings: 'حفظ إعدادات التبرعات',
    admin_total_donations: 'إجمالي التبرعات',
    admin_pending_donations: 'التبرعات المعلقة',
    admin_verified_donations: 'التبرعات المؤكدة',
    admin_status_pending: 'معلق',
    admin_status_verified: 'مؤكد',
    admin_status_rejected: 'مرفوض',
    admin_mark_verified: 'تأكيد',
    admin_mark_rejected: 'رفض',
    admin_confirm_status_change: 'هل أنت متأكد من تغيير حالة التبرع؟',
    admin_explorer_template: 'قالب رابط المستكشف (Explorer Template)',
    admin_title_ar: 'العنوان بالعربية',
    admin_title_en: 'العنوان بالإنجليزية',
    admin_desc_ar: 'الوصف بالعربية',
    admin_desc_en: 'الوصف بالإنجليزية',

    error_no_pdf: 'رابط الكتاب غير موجود',
    error_pdf_lib: 'حدث خطأ أثناء تحميل مكتبة القراءة',
    error_pdf_404: 'الملف غير موجود (404)',
    error_pdf_general: 'حدث خطأ أثناء فتح الكتاب، تأكد من سرعة الإنترنت لديك ثم أعد تحديث الصفحة وحاول من جديد',
    confirm_remove_recent: 'هل تريد إزالة هذا الكتاب من القائمة؟',
    edu_notice: 'تنويه تربوي وقيمة معرفية',
    edu_title: 'العلم صيدٌ والكتابةُ قيدُه',
    edu_quote: 'قيّد صيودك بالحبال الواثقة.. إن من الحماقة أن تصيد غزالة وتتركها بين الخلائق طالقة.',
    edu_desc: 'ندعوك لاستثمار هذا الوقت في تأمل فضل العلم، ونشجعك على تدوين فوائد هذا الكتاب ونشرها لتعم المنفعة.',
    did_you_know: 'هل تعلم؟',
    did_you_know_desc: 'مكتبة الهدى تخدم آلاف الباحثين شهرياً، مساهمتك في نشر رابط الموقع تدعم استمرار هذا العطاء العلمي.',
    cancel_and_return: 'إلغاء العملية والعودة',
    back: 'رجوع',
    night_mode: 'الوضع الليلي',
    download_pdf: 'تحميل PDF',
    sorry_error: 'عذراً، حدث خطأ أثناء فتح الكتاب',
    security_restriction_msg: 'حدث خطأ أثناء فتح الكتاب، تأكد من سرعة الإنترنت لديك ثم أعد تحديث الصفحة وحاول من جديد',
    preparing_book: 'جارٍ تحضير الكتاب للتحميل',
    preparation_progress: 'نسبة التحضير',
    of_label: 'من',
    history_title: 'قائمة القراءة',
    history_desc: 'هنا تجد جميع الكتب التي بدأت قراءتها، مع حفظ تلقائي لآخر صفحة توقفت عندها.',
    history_search: 'ابحث في قائمتك...',
    history_total: 'إجمالي الكتب: {count}',
    history_empty: 'قائمتك فارغة حالياً',
    history_empty_desc: 'ابدأ بقراءة أي كتاب من المكتبة وسيظهر هنا تلقائياً.',
    history_last_read: 'آخر قراءة: {date}',
    history_resume: 'استكمال القراءة',
    back_to_library: 'العودة للمكتبة',
    completion_rate: 'نسبة الإنجاز',
    global_digital_library: 'المكتبة الرقمية العالمية',
    search_header_title: 'ابحث في الموسوعة',
    search_header_subtitle: 'استكشف أكثر من 500,000 كتاب ومخطوط إسلامي، وابحث عن أي كتاب إسلامي بأي لغة بسهولة وسرعة',
    pin_offline_hint: '📍 اضغط علامة التثبيت لتتمكن من قراءة الكتاب في أي وقت بدون انترنت',
    about_us: 'من نحن',
    contact_us: 'اتصل بنا',
    privacy_policy: 'سياسة الخصوصية',
    terms_of_use: 'شروط الاستخدام',
    copyright_policy: 'سياسة حقوق النشر (DMCA)'
  },
  en: {
    title: 'Huda Library',
    subtitle: 'Comprehensive Electronic Library for Islamic Books, Papers, and Manuscripts',
    search_placeholder: 'Search by title, author, or subject...',
    search_button: 'Search',
    loading: 'Loading...',
    no_results: 'No results found',
    try_another_word: 'Try searching for another word',
    results_found: 'Found {count} books',
    back_to_home: 'Back to Home',
    featured_categories: 'Library Sections',
    read_more: 'Read More',
    offline_notice: '📚 Your reading position is automatically saved for easy continuation.',
    footer_text: 'A non-profit project aimed at facilitating access to valuable Islamic books and rare manuscripts from global library archives.',
    rights_reserved: 'All Rights Reserved © {year} - Huda Library',
    load_more: 'Load More',
    continue_reading: 'Continue Reading',
    recent_books: 'Recent Books',
    show_more: 'Show More',
    show_less: 'Show Less',
    download: 'Download',
    read_now: 'Read',
    category: 'Category',
    author: 'Author',
    parts: 'Parts',
    no_books_in_category: 'No books in this category currently',
    home: 'Home',
    language_switcher: 'العربية',
    error_search: 'An error occurred during search',
    search_start_title: 'Search our Islamic Library',
    search_start_desc: 'Type book or author name to start',
    publisher: 'Publisher',
    multi_part: 'Multi-part ({count})',
    available_offline: 'Available offline',
    unpin: 'Unpin',
    pin: 'Pin',
    remove: 'Remove',
    view_full_history: 'View Full History',
    ready_for_offline: 'Ready for offline reading',
    pwa_install_title: 'Install App',
    pwa_install_desc: 'Browse and read thousands of Islamic books easily from your home screen',
    pwa_install_btn: 'Install Now',
    pwa_cancel: 'Not Now',
    page_of: 'Page {current} of {total}',
    select_part_read: 'Select part to read',
    select_part_download: 'Select part to download',
    close: 'Close',
    loading_book: 'Loading book...',
    preparing_download: 'Preparation complete, downloading now...',
    dont_close_page: 'Please do not close this page until the bar is complete',
    book_label: 'Book',

    // Donation Strings
    donate_button_text: '❤️ Support Huda Library',
    donate_title: 'Support Huda Library',
    donate_subtitle: 'Huda Library is a non-profit knowledge project dedicated to providing free access to Islamic resources, books, and manuscripts for researchers and readers worldwide. Your support helps us maintain and develop our services.',
    donate_any_amount: 'You can donate any amount that suits you.',
    donate_select_method: 'Select Donation Method',
    donate_amount_preset: 'Suggested Donation Amount',
    donate_custom_amount: 'Custom Amount',
    donate_transfer_instruction: 'Transfer {amount} {currency} to the following address:',
    donate_wallet_address: 'Wallet Address',
    donate_copy_address: 'Copy Wallet Address',
    donate_address_copied: 'Wallet address copied ✓',
    donate_warning_title: '⚠️ Send {currency} via {network} network only.',
    donate_warning_desc: 'Make sure to select the correct network before sending. Crypto transactions are non-refundable.',
    donate_explorer_link: 'View Address on Blockchain Explorer',
    donate_confirm_prompt: 'Did you already donate?',
    donate_confirm_desc: 'You can send the Transaction Hash to help us record your donation.',
    donate_tx_hash: 'Transaction Hash',
    donate_donor_name: 'Name (Optional)',
    donate_donor_email: 'Email (Optional)',
    donate_donor_message: 'Message (Optional)',
    donate_submit_confirm: 'Submit Donation Confirmation',
    donate_confirm_success: 'Donation info submitted successfully, thank you for your support.',
    donate_why_support: 'Why Your Support Matters',
    donate_reason_1: 'Continuous operation and maintenance of the digital library',
    donate_reason_2: 'Hosting content and preserving rare manuscripts & books',
    donate_reason_3: 'Digitizing Islamic resources and providing free access to all',
    donate_reason_4: 'Developing the platform and enhancing search performance',
    donate_reason_5: 'Improving reading experience and research tools for scholars',
    donate_page_meta_title: 'Support Huda Library | Donate',
    donate_page_meta_desc: 'Your contribution enables us to provide thousands of Islamic books & manuscripts for free to researchers worldwide.',
    donate_share_title: 'Support Huda Library',
    donate_share_text: 'Support Huda Library in providing free access to Islamic books and manuscripts for everyone.',

    // Admin Strings
    admin_title: 'Huda Library Control Panel',
    admin_main_site: 'Main Site',
    admin_search_archive: 'Search Global Library (Archive)',
    admin_categories_suggestions: 'Category Management & Smart Suggestions',
    admin_add_category: 'Add Category',
    admin_cancel: 'Cancel',
    admin_save_category: 'Save Category',
    admin_generate_ai: 'AI Generation (OpenAI)',
    admin_smart_suggestions: 'Smart Book Suggestions',
    admin_authors_management: 'Authors Management',
    admin_add_author: 'Add Author',
    admin_save_author: 'Save Author',
    admin_seo_preparation: 'Professional SEO Page Preparation',
    admin_seo_meta_title: 'SEO Meta Title',
    admin_slug: 'URL Slug',
    admin_category: 'Category',
    admin_author: 'Author',
    admin_parts_count: 'Parts Count',
    admin_seo_description: 'Book Description (SEO Content)',
    admin_save_and_publish: 'Save and Publish Page',
    admin_update_data: 'Update Data',
    admin_smart_system_ready: 'Smart System Ready',
    admin_smart_system_desc: 'Use the "Smart Book Suggestions" button to quickly add professional content using AI.',
    admin_suggested_books: 'Suggested books for: {category}',
    admin_found_books: 'Fetched {count} books from Archive.org.',
    admin_search_more: 'Search for other books in this category...',
    admin_analyzing: 'Analyzing hundreds of books and ranking them with AI... Please wait',
    admin_no_suggestions: 'No new suggestions found for this category currently.',
    admin_reject_selected: 'Reject Selected',
    admin_selected_count: 'Selected {count} books',
    admin_add_selected: 'Add Selected Books',
    admin_processing: 'Processing...',
    admin_ai_magic_working: 'AI Magic in Progress...',
    admin_ai_magic_desc: 'We are fetching the best copies, generating professional SEO content, and building pages automatically. Please do not close this window.',
    admin_added_already: 'Already Added',
    admin_rejected: 'Rejected',
    admin_new: 'New',
    admin_tab_arabic: 'المحتوى العربي',
    admin_tab_english: 'English Content',
    admin_language: 'Language',
    admin_select_lang: 'Select Language',
    admin_desc_limit_hint: 'Prefer description between 150-300 words for best indexing.',
    admin_cat_placeholder: 'Category Name (e.g. Hadith Books)',
    admin_cat_desc_placeholder: 'Category Description for SEO',
    admin_author_name_placeholder: 'Full Author Name',
    admin_author_bio_placeholder: 'Short Bio for SEO',
    admin_success_save_book: 'Book saved successfully',
    admin_error_save_book: 'Save error: check Supabase configuration',
    admin_success_save_cat: 'Category added',
    admin_error_save_cat: 'Error saving category',
    admin_success_save_author: 'Author added',
    admin_error_save_author: 'Error saving author',
    admin_bulk_success: 'All books added successfully',
    admin_bulk_partial_error: 'Added with errors in {count} books. Check logs.',
    admin_bulk_error: 'Bulk addition failed (server error)',
    admin_conn_error: 'Connection error',
    admin_donations: 'Donations',
    admin_donation_settings: 'Donation Settings',
    admin_donations_list: 'Donations Log',
    admin_donation_enabled: 'Enable Donations',
    admin_show_donation_button: 'Show Fixed Donation Button',
    admin_wallet_address: 'Receiving Wallet Address (Public)',
    admin_network: 'Network',
    admin_currency: 'Currency',
    admin_qr_code_url: 'QR Code Image URL (Optional)',
    admin_preset_amounts: 'Preset Amounts (comma separated)',
    admin_preview_modal: 'Preview Donation Modal',
    admin_save_settings: 'Save Donation Settings',
    admin_total_donations: 'Total Donations',
    admin_pending_donations: 'Pending Donations',
    admin_verified_donations: 'Verified Donations',
    admin_status_pending: 'Pending',
    admin_status_verified: 'Verified',
    admin_status_rejected: 'Rejected',
    admin_mark_verified: 'Mark Verified',
    admin_mark_rejected: 'Mark Rejected',
    admin_confirm_status_change: 'Are you sure you want to change donation status?',
    admin_explorer_template: 'Explorer Link Template',
    admin_title_ar: 'Arabic Title',
    admin_title_en: 'English Title',
    admin_desc_ar: 'Arabic Description',
    admin_desc_en: 'English Description',

    error_no_pdf: 'Book link not found',
    error_pdf_lib: 'An error occurred while loading the reading library',
    error_pdf_404: 'File not found (404)',
    error_pdf_general: 'An error occurred while opening the book, please check your internet speed, then refresh the page and try again',
    confirm_remove_recent: 'Do you want to remove this book from the list?',
    edu_notice: 'Educational Notice & Knowledge Value',
    edu_title: 'Knowledge is Prey and Writing is its Tether',
    edu_quote: '"Tether your prey with strong ropes.. for it is foolish to hunt a gazelle and leave it untethered among the creatures."',
    edu_desc: 'We invite you to use this time to reflect on the virtue of knowledge, and we encourage you to record the benefits of this book and share them for common good.',
    did_you_know: 'Did you know?',
    did_you_know_desc: 'Huda Library serves thousands of researchers monthly; your contribution in sharing the site link supports the continuation of this scientific gift.',
    cancel_and_return: 'Cancel Process',
    back: 'Back',
    night_mode: 'Night Mode',
    download_pdf: 'Download PDF',
    sorry_error: 'Sorry, an error occurred while opening the book',
    security_restriction_msg: 'An error occurred while opening the book, please check your internet speed, then refresh the page and try again',
    preparing_book: 'Preparing book for download',
    preparation_progress: 'Preparation Progress',
    of_label: 'of',
    history_title: 'Reading History',
    history_desc: 'Here you can find all the books you have started reading, with auto-save for the last page you stopped at.',
    history_search: 'Search your list...',
    history_total: 'Total books: {count}',
    history_empty: 'Your list is currently empty',
    history_empty_desc: 'Start reading any book from the library and it will appear here automatically.',
    history_last_read: 'Last read: {date}',
    history_resume: 'Continue Reading',
    back_to_library: 'Back to Library',
    completion_rate: 'Completion Rate',
    global_digital_library: 'Global Digital Library',
    search_header_title: 'Search the Encyclopedia',
    search_header_subtitle: 'Explore over 500,000 Islamic books and manuscripts, and find any Islamic book in any language easily and quickly',
    pin_offline_hint: '📍 Click the pin icon to read the book anytime without internet',
    about_us: 'About Us',
    contact_us: 'Contact Us',
    privacy_policy: 'Privacy Policy',
    terms_of_use: 'Terms of Use',
    copyright_policy: 'Copyright Policy (DMCA)'
  }
};
