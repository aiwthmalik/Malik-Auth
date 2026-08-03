export type Language = 'en' | 'ur' | 'ar';

export interface TranslationSet {
  // Navigation
  nav_dashboard: string;
  nav_licenses: string;
  nav_users: string;
  nav_sessions: string;
  nav_remote: string;
  nav_sdk: string;
  nav_activity: string;
  nav_settings: string;
  nav_apps: string;

  // Actions
  action_save: string;
  action_delete: string;
  action_create: string;
  action_edit: string;
  action_cancel: string;
  action_confirm: string;
  action_search: string;
  action_export: string;
  action_import: string;
  action_refresh: string;
  action_copy: string;
  action_download: string;
  action_upload: string;
  action_add: string;
  action_remove: string;
  action_enable: string;
  action_disable: string;
  action_generate: string;
  action_reset: string;

  // Status
  status_active: string;
  status_expired: string;
  status_banned: string;
  status_unused: string;
  status_suspended: string;
  status_maintenance: string;
  status_disabled: string;
  status_terminated: string;
  status_revoked: string;

  // Messages
  msg_success: string;
  msg_error: string;
  msg_loading: string;
  msg_no_data: string;
  msg_confirm_delete: string;
  msg_saved: string;
  msg_deleted: string;
  msgCopied: string;
  msg_network_error: string;
  msg_unauthorized: string;
  msg_forbidden: string;

  // Labels
  label_username: string;
  label_password: string;
  label_email: string;
  label_license_key: string;
  label_app_id: string;
  label_app_secret: string;
  label_status: string;
  label_role: string;
  label_created: string;
  label_expires: string;
  label_last_seen: string;
  label_ip_address: string;
  label_hwid: string;
  label_session_id: string;
  label_version: string;
  label_name: string;
  label_description: string;
  label_recipients: string;
  label_event_types: string;
  label_webhook_url: string;

  // Page titles
  title_dashboard: string;
  title_licenses: string;
  title_users: string;
  title_sessions: string;
  title_remote_variables: string;
  title_sdk_files: string;
  title_activity_logs: string;
  title_settings: string;
  title_applications: string;
  title_email_notifications: string;
  title_sdk_download: string;
  title_branding: string;
  title_webhooks: string;
  title_two_factor: string;
  title_ip_whitelist: string;
  title_role_manager: string;
  title_license_groups: string;
  title_analytics: string;

  // Misc
  misc_light: string;
  misc_dark: string;
  misc_language: string;
  misc_sign_out: string;
  misc_welcome: string;
  misc_total: string;
  misc_active_count: string;
  misc_expired_count: string;
  misc_page: string;
  misc_of: string;
  misc_rows: string;
  misc_select_all: string;
  misc_bulk_actions: string;
}

const translations: Record<Language, TranslationSet> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_licenses: 'License Keys',
    nav_users: 'End Users',
    nav_sessions: 'Live Sessions',
    nav_remote: 'Remote Variables',
    nav_sdk: 'C# SDK',
    nav_activity: 'Activity Logs',
    nav_settings: 'Settings',
    nav_apps: 'Applications',

    action_save: 'Save',
    action_delete: 'Delete',
    action_create: 'Create',
    action_edit: 'Edit',
    action_cancel: 'Cancel',
    action_confirm: 'Confirm',
    action_search: 'Search',
    action_export: 'Export',
    action_import: 'Import',
    action_refresh: 'Refresh',
    action_copy: 'Copy',
    action_download: 'Download',
    action_upload: 'Upload',
    action_add: 'Add',
    action_remove: 'Remove',
    action_enable: 'Enable',
    action_disable: 'Disable',
    action_generate: 'Generate',
    action_reset: 'Reset',

    status_active: 'Active',
    status_expired: 'Expired',
    status_banned: 'Banned',
    status_unused: 'Unused',
    status_suspended: 'Suspended',
    status_maintenance: 'Maintenance',
    status_disabled: 'Disabled',
    status_terminated: 'Terminated',
    status_revoked: 'Revoked',

    msg_success: 'Success',
    msg_error: 'Error',
    msg_loading: 'Loading...',
    msg_no_data: 'No data available',
    msg_confirm_delete: 'Are you sure you want to delete this?',
    msg_saved: 'Saved successfully',
    msg_deleted: 'Deleted successfully',
    msgCopied: 'Copied to clipboard',
    msg_network_error: 'Network error. Please try again.',
    msg_unauthorized: 'Unauthorized. Please log in.',
    msg_forbidden: 'Access denied.',

    label_username: 'Username',
    label_password: 'Password',
    label_email: 'Email',
    label_license_key: 'License Key',
    label_app_id: 'App ID',
    label_app_secret: 'App Secret',
    label_status: 'Status',
    label_role: 'Role',
    label_created: 'Created',
    label_expires: 'Expires',
    label_last_seen: 'Last Seen',
    label_ip_address: 'IP Address',
    label_hwid: 'HWID',
    label_session_id: 'Session ID',
    label_version: 'Version',
    label_name: 'Name',
    label_description: 'Description',
    label_recipients: 'Recipients',
    label_event_types: 'Event Types',
    label_webhook_url: 'Webhook URL',

    title_dashboard: 'Dashboard',
    title_licenses: 'License Keys',
    title_users: 'End Users',
    title_sessions: 'Live Sessions',
    title_remote_variables: 'Remote Variables',
    title_sdk_files: 'C# WinForms SDK',
    title_activity_logs: 'Activity Logs',
    title_settings: 'Settings',
    title_applications: 'Applications',
    title_email_notifications: 'Email Notifications',
    title_sdk_download: 'SDK Downloads',
    title_branding: 'Custom Branding',
    title_webhooks: 'Discord Webhooks',
    title_two_factor: 'Two-Factor Authentication',
    title_ip_whitelist: 'IP Whitelist',
    title_role_manager: 'Role Manager',
    title_license_groups: 'License Groups',
    title_analytics: 'Analytics',

    misc_light: 'Light',
    misc_dark: 'Dark',
    misc_language: 'Language',
    misc_sign_out: 'Sign Out',
    misc_welcome: 'Welcome',
    misc_total: 'Total',
    misc_active_count: 'Active',
    misc_expired_count: 'Expired',
    misc_page: 'Page',
    misc_of: 'of',
    misc_rows: 'rows',
    misc_select_all: 'Select All',
    misc_bulk_actions: 'Bulk Actions',
  },
  ur: {
    nav_dashboard: 'ڈیش بورڈ',
    nav_licenses: 'لائسنس کیز',
    nav_users: 'صارفین',
    nav_sessions: 'سیشنز',
    nav_remote: 'ریموٹ متغیرات',
    nav_sdk: 'سی # ایس ڈی کے',
    nav_activity: 'سرگرمی لاگز',
    nav_settings: 'ترتیبات',
    nav_apps: 'ایپلی کیشنز',

    action_save: 'محفوظ کریں',
    action_delete: 'حذف کریں',
    action_create: 'بنائیں',
    action_edit: 'ترمیم کریں',
    action_cancel: 'منسوخ',
    action_confirm: 'تصدیق کریں',
    action_search: 'تلاش کریں',
    action_export: 'برآمد',
    action_import: 'درآمد',
    action_refresh: 'ریفریش',
    action_copy: 'کاپی',
    action_download: 'ڈاؤن لوڈ',
    action_upload: 'اپ لوڈ',
    action_add: 'شامل کریں',
    action_remove: 'ہٹائیں',
    action_enable: 'فعال کریں',
    action_disable: 'غیر فعال',
    action_generate: 'تیار کریں',
    action_reset: 'ری سیٹ',

    status_active: 'فعال',
    status_expired: 'میعاد ختم',
    status_banned: 'پابند',
    status_unused: 'غیر استعمال شدہ',
    status_suspended: 'معطل',
    status_maintenance: 'دیکھ بھال',
    status_disabled: 'غیر فعال',
    status_terminated: 'ختم شدہ',
    status_revoked: 'منسوخ',

    msg_success: 'کامیابی',
    msg_error: 'خرابی',
    msg_loading: 'لوڈ ہو رہا ہے...',
    msg_no_data: 'کوئی ڈیٹا دستیاب نہیں',
    msg_confirm_delete: 'کیا آپ واقعی اسے حذف کرنا چاہتے ہیں؟',
    msg_saved: 'کامیابی سے محفوظ ہوا',
    msg_deleted: 'کامیابی سے حذف ہوا',
    msgCopied: 'کلپ بورڈ پر کاپی ہوا',
    msg_network_error: 'نیٹ ورک خرابی۔ دوبارہ کوشش کریں۔',
    msg_unauthorized: 'غیر مجاز۔ براہ کرم لاگ ان کریں۔',
    msg_forbidden: ' رسائی منع ہے۔',

    label_username: 'صارف نام',
    label_password: 'پاس ورڈ',
    label_email: 'ای میل',
    label_license_key: 'لائسنس کی',
    label_app_id: 'ایپ آئی ڈی',
    label_app_secret: 'ایپ خفیہ',
    label_status: 'حالت',
    label_role: 'کردار',
    label_created: 'تاریخ',
    label_expires: 'میعاد',
    label_last_seen: 'آخری بار دیکھا',
    label_ip_address: 'آئی پی پتہ',
    label_hwid: 'ایچ ڈبلیو آئی ڈی',
    label_session_id: 'سیشن آئی ڈی',
    label_version: 'ورژن',
    label_name: 'نام',
    label_description: 'تفصیل',
    label_recipients: 'وصول کنندگان',
    label_event_types: 'واقعہ کی قسمیں',
    label_webhook_url: 'ویب ہوک یو آر ایل',

    title_dashboard: 'ڈیش بورڈ',
    title_licenses: 'لائسنس کیز',
    title_users: 'صارفین',
    title_sessions: 'سیشنز',
    title_remote_variables: 'ریموٹ متغیرات',
    title_sdk_files: 'سی # ون فارمز ایس ڈی کے',
    title_activity_logs: 'سرگرمی لاگز',
    title_settings: 'ترتیبات',
    title_applications: 'ایپلی کیشنز',
    title_email_notifications: 'ای میل اطلاعات',
    title_sdk_download: 'ایس ڈی کے ڈاؤن لوڈ',
    title_branding: 'حسب ضرورت برانڈنگ',
    title_webhooks: 'ڈسکارڈ ویب ہوکس',
    title_two_factor: 'دو عناصری تصدیق',
    title_ip_whitelist: 'آئی پی وائٹ لسٹ',
    title_role_manager: 'کردار مینیجر',
    title_license_groups: 'لائسنس گروپس',
    title_analytics: 'تجزیات',

    misc_light: 'روشن',
    misc_dark: 'اندھیرا',
    misc_language: 'زبان',
    misc_sign_out: 'لاگ آؤٹ',
    misc_welcome: 'خوش آمدید',
    misc_total: 'کل',
    misc_active_count: 'فعال',
    misc_expired_count: 'میعاد ختم',
    misc_page: 'صفحہ',
    misc_of: 'کا',
    misc_rows: 'قطاریں',
    misc_select_all: 'سب منتخب کریں',
    misc_bulk_actions: 'بلک ایکشن',
  },
  ar: {
    nav_dashboard: 'لوحة القيادة',
    nav_licenses: 'مفاتيح الترخيص',
    nav_users: 'المستخدمون',
    nav_sessions: 'الجلسات',
    nav_remote: 'المتغيرات البعيدة',
    nav_sdk: 'C# SDK',
    nav_activity: 'سجلات النشاط',
    nav_settings: 'الإعدادات',
    nav_apps: 'التطبيقات',

    action_save: 'حفظ',
    action_delete: 'حذف',
    action_create: 'إنشاء',
    action_edit: 'تعديل',
    action_cancel: 'إلغاء',
    action_confirm: 'تأكيد',
    action_search: 'بحث',
    action_export: 'تصدير',
    action_import: 'استيراد',
    action_refresh: 'تحديث',
    action_copy: 'نسخ',
    action_download: 'تحميل',
    action_upload: 'رفع',
    action_add: 'إضافة',
    action_remove: 'إزالة',
    action_enable: 'تفعيل',
    action_disable: 'تعطيل',
    action_generate: 'توليد',
    action_reset: 'إعادة تعيين',

    status_active: 'نشط',
    status_expired: 'منتهي الصلاحية',
    status_banned: 'محظور',
    status_unused: 'غير مستخدم',
    status_suspended: 'معلق',
    status_maintenance: 'صيانة',
    status_disabled: 'معطل',
    status_terminated: 'منتهي',
    status_revoked: 'ملغى',

    msg_success: 'نجاح',
    msg_error: 'خطأ',
    msg_loading: 'جاري التحميل...',
    msg_no_data: 'لا توجد بيانات',
    msg_confirm_delete: 'هل أنت متأكد أنك تريد الحذف؟',
    msg_saved: 'تم الحفظ بنجاح',
    msg_deleted: 'تم الحذف بنجاح',
    msgCopied: 'تم النسخ إلى الحافظة',
    msg_network_error: 'خطأ في الشبكة. يرجى المحاولة مرة أخرى.',
    msg_unauthorized: 'غير مصرح. يرجى تسجيل الدخول.',
    msg_forbidden: 'الوصول مرفوض.',

    label_username: 'اسم المستخدم',
    label_password: 'كلمة المرور',
    label_email: 'البريد الإلكتروني',
    label_license_key: 'مفتاح الترخيص',
    label_app_id: 'معرف التطبيق',
    label_app_secret: 'secret التطبيق',
    label_status: 'الحالة',
    label_role: 'الدور',
    label_created: 'تاريخ الإنشاء',
    label_expires: 'ينتهي في',
    label_last_seen: 'آخر ظهور',
    label_ip_address: 'عنوان IP',
    label_hwid: 'معرف الجهاز',
    label_session_id: 'معرف الجلسة',
    label_version: 'الإصدار',
    label_name: 'الاسم',
    label_description: 'الوصف',
    label_recipients: 'المستلمون',
    label_event_types: 'أنواع الأحداث',
    label_webhook_url: 'رابط Webhook',

    title_dashboard: 'لوحة القيادة',
    title_licenses: 'مفاتيح الترخيص',
    title_users: 'المستخدمون',
    title_sessions: 'الجلسات',
    title_remote_variables: 'المتغيرات البعيدة',
    title_sdk_files: 'ملفات SDK لـ C# WinForms',
    title_activity_logs: 'سجلات النشاط',
    title_settings: 'الإعدادات',
    title_applications: 'التطبيقات',
    title_email_notifications: 'إشعارات البريد الإلكتروني',
    title_sdk_download: 'تحميل SDK',
    title_branding: 'التخصيص',
    title_webhooks: 'Discord Webhooks',
    title_two_factor: 'المصادقة الثنائية',
    title_ip_whitelist: 'قائمة IP البيضاء',
    title_role_manager: 'مدير الأدوار',
    title_license_groups: 'مجموعات التراخيص',
    title_analytics: 'التحليلات',

    misc_light: 'فاتح',
    misc_dark: 'داكن',
    misc_language: 'اللغة',
    misc_sign_out: 'تسجيل خروج',
    misc_welcome: 'مرحباً',
    misc_total: 'الإجمالي',
    misc_active_count: 'نشط',
    misc_expired_count: 'منتهي',
    misc_page: 'صفحة',
    misc_of: 'من',
    misc_rows: 'صفوف',
    misc_select_all: 'تحديد الكل',
    misc_bulk_actions: 'إجراءات مجمعة',
  },
};

const STORAGE_KEY = 'malikauth_language';
const DEFAULT_LANG: Language = 'en';

let currentLang: Language = (localStorage.getItem(STORAGE_KEY) as Language) || DEFAULT_LANG;
let listeners: Array<() => void> = [];

export function getLanguage(): Language {
  return currentLang;
}

export function setLanguage(lang: Language): void {
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  listeners.forEach(fn => fn());
}

export function t(key: keyof TranslationSet): string {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

export function onLanguageChange(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}

export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    ur: 'اردو',
    ar: 'العربية',
  };
  return names[lang];
}

export function getLanguageFlag(lang: Language): string {
  const flags: Record<Language, string> = {
    en: '🇬🇧',
    ur: '🇵🇰',
    ar: '🇸🇦',
  };
  return flags[lang];
}

export function getSupportedLanguages(): Language[] {
  return ['en', 'ur', 'ar'];
}
