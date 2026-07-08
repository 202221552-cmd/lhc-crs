// ==========================================
// Jordanian Universities & Colleges
// ==========================================
export const JORDANIAN_UNIVERSITIES: string[] = [
  // Universities
  'الجامعة الأردنية',
  'الجامعة الأردنية - فرع العقبة',
  'الجامعة الألمانية الأردنية',
  'الجامعة الأمريكية في مادبا',
  'الجامعة العربية المفتوحة - الأردن',
  'الجامعة الهاشمية',
  'جامعة آل البيت',
  'جامعة البلقاء التطبيقية',
  'جامعة البترا',
  'جامعة الأميرة سمية للتكنولوجيا',
  'جامعة الحسين التقنية',
  'جامعة الحسين بن طلال',
  'جامعة الزرقاء',
  'جامعة الزيتونة الأردنية',
  'جامعة الشرق الأوسط',
  'جامعة الطفيلة التقنية',
  'جامعة العلوم التطبيقية الخاصة',
  'جامعة العلوم الإسلامية العالمية',
  'جامعة العلوم والتكنولوجيا الأردنية',
  'جامعة العقبة للتكنولوجيا',
  'جامعة إربد الأهلية',
  'جامعة الإسراء',
  'جامعة جدارا',
  'جامعة جرش',
  'جامعة عمان الأهلية',
  'جامعة عمان العربية',
  'جامعة فيلادلفيا',
  'جامعة مؤتة',
  'جامعة عجلون الوطنية',
  // Colleges
  'كلية الأميرة عالية الجامعية',
  'كلية الأميرة رحمة الجامعية',
  'كلية الحصن الجامعية',
  'كلية الزرقاء الجامعية',
  'كلية الشوبك الجامعية',
  'كلية العقبة الجامعية',
  'كلية الكرك الجامعية',
  'كلية إربد الجامعية',
  'كلية عمان الجامعية للعلوم المالية والإدارية',
  'كلية عجلون الجامعية',
  'كلية معان الجامعية',
  'كلية الهندسة التكنولوجية (البوليتكنك)',
  'الكلية الجامعية الوطنية للتكنولوجيا',
  'الكلية الجامعية العربية للتكنولوجيا',
  'كلية العلوم التربوية والآداب (جامعة ناعور)',
  'كلية الخوارزمي الجامعية التقنية',
  'كلية عمون الجامعية التطبيقية',
  'كلية لومينوس الجامعية التقنية',
  'كلية طلال أبو غزالة الجامعية للابتكار',
  // Academies
  'أكاديمية الأمير حسين للحماية المدنية',
  'الأكاديمية الأردنية للموسيقى',
  // Hospitals
  'مستشفى الجامعة الأردنية',
  'مستشفى الملك المؤسس عبد الله الجامعي',
];

// ==========================================
// Country Codes with Flags
// ==========================================
export interface CountryCode {
  code: string;
  name: string;
  flag: string;
  maxDigits: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+962', name: 'الأردن', flag: '🇯🇴', maxDigits: 9 },
  { code: '+966', name: 'السعودية', flag: '🇸🇦', maxDigits: 9 },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪', maxDigits: 9 },
  { code: '+965', name: 'الكويت', flag: '🇰🇼', maxDigits: 8 },
  { code: '+968', name: 'عُمان', flag: '🇴🇲', maxDigits: 8 },
  { code: '+974', name: 'قطر', flag: '🇶🇦', maxDigits: 8 },
  { code: '+973', name: 'البحرين', flag: '🇧🇭', maxDigits: 8 },
  { code: '+967', name: 'اليمن', flag: '🇾🇪', maxDigits: 9 },
  { code: '+963', name: 'سوريا', flag: '🇸🇾', maxDigits: 9 },
  { code: '+961', name: 'لبنان', flag: '🇱🇧', maxDigits: 8 },
  { code: '+964', name: 'العراق', flag: '🇮🇶', maxDigits: 10 },
  { code: '+20', name: 'مصر', flag: '🇪🇬', maxDigits: 10 },
  { code: '+218', name: 'ليبيا', flag: '🇱🇾', maxDigits: 10 },
  { code: '+216', name: 'تونس', flag: '🇹🇳', maxDigits: 8 },
  { code: '+213', name: 'الجزائر', flag: '🇩🇿', maxDigits: 9 },
  { code: '+212', name: 'المغرب', flag: '🇲🇦', maxDigits: 9 },
  { code: '+249', name: 'السودان', flag: '🇸🇩', maxDigits: 9 },
  { code: '+970', name: 'فلسطين', flag: '🇵🇸', maxDigits: 9 },
  { code: '+90', name: 'تركيا', flag: '🇹🇷', maxDigits: 10 },
  { code: '+98', name: 'إيران', flag: '🇮🇷', maxDigits: 10 },
  { code: '+1', name: 'أمريكا / كندا', flag: '🇺🇸', maxDigits: 10 },
  { code: '+44', name: 'المملكة المتحدة', flag: '🇬🇧', maxDigits: 10 },
  { code: '+49', name: 'ألمانيا', flag: '🇩🇪', maxDigits: 11 },
  { code: '+33', name: 'فرنسا', flag: '🇫🇷', maxDigits: 9 },
  { code: '+39', name: 'إيطاليا', flag: '🇮🇹', maxDigits: 10 },
  { code: '+34', name: 'إسبانيا', flag: '🇪🇸', maxDigits: 9 },
  { code: '+7', name: 'روسيا', flag: '🇷🇺', maxDigits: 10 },
  { code: '+86', name: 'الصين', flag: '🇨🇳', maxDigits: 11 },
  { code: '+91', name: 'الهند', flag: '🇮🇳', maxDigits: 10 },
  { code: '+92', name: 'باكستان', flag: '🇵🇰', maxDigits: 10 },
  { code: '+880', name: 'بنغلاديش', flag: '🇧🇩', maxDigits: 10 },
  { code: '+63', name: 'الفلبين', flag: '🇵🇭', maxDigits: 10 },
  { code: '+62', name: 'إندونيسيا', flag: '🇮🇩', maxDigits: 12 },
  { code: '+60', name: 'ماليزيا', flag: '🇲🇾', maxDigits: 9 },
  { code: '+351', name: 'البرتغال', flag: '🇵🇹', maxDigits: 9 },
  { code: '+30', name: 'اليونان', flag: '🇬🇷', maxDigits: 10 },
  { code: '+20', name: 'مصر', flag: '🇪🇬', maxDigits: 10 },
  { code: '+251', name: 'إثيوبيا', flag: '🇪🇹', maxDigits: 9 },
  { code: '+254', name: 'كينيا', flag: '🇰🇪', maxDigits: 9 },
  { code: '+27', name: 'جنوب أفريقيا', flag: '🇿🇦', maxDigits: 9 },
];

// ==========================================
// Utility: Normalize Arabic/Eastern digits to English
// ==========================================
export const normalizeDigits = (str: string): string => {
  return str.replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
            .replace(/[\u06f0-\u06f9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 48));
};

// ==========================================
// Payment Methods
// ==========================================
export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'نقدي 💵', icon: '💵' },
  { value: 'BANK', label: 'حوالة بنكية 🏦', icon: '🏦' },
  { value: 'CARD', label: 'بطاقة 💳', icon: '💳' },
  { value: 'TRANSFER', label: 'تحويل إلكتروني 📱', icon: '📱' },
  { value: 'WALLET', label: 'محفظة إلكترونية 📲', icon: '📲' },
  { value: 'CLICK', label: 'حوالة كليك 🔄', icon: '🔄' },
  { value: 'ENTITY', label: 'جهة تعليمية 🏫', icon: '🏫' },
  { value: 'CHECK', label: 'شيك 📄', icon: '📄' },
];

export const WALLET_OPTIONS = [
  { value: 'UMNIAH', label: 'أمنية كاش' },
  { value: 'ORANGE', label: 'أورانج موني' },
  { value: 'ZAIN', label: 'زين كاش' },
  { value: 'DINARAK', label: 'دينارك' },
  { value: 'ALAWNEH', label: 'علاونه' },
];

export const BANK_OPTIONS = [
  { value: 'Jordan_Ahli', label: 'البنك الأهلي الأردني' },
  { value: 'Arab_Bank', label: 'البنك العربي' },
  { value: 'Housing_Bank', label: 'بنك الإسكان' },
  { value: 'Cairo_Amman', label: 'بنك القاهرة عمان' },
  { value: 'Jordan_Kuwait', label: 'البنك الأردني الكويتي' },
  { value: 'Islamic_Bank', label: 'البنك الإسلامي الأردني' },
  { value: 'Safwa_Islamic', label: 'بنك صفوة الإسلامي' },
  { value: 'Etihad', label: 'بنك الاتحاد' },
  { value: 'Societe_Generale', label: 'بنك سوسيتيه جنرال' },
  { value: 'Bank_of_Jordan', label: 'بنك الأردن' },
  { value: 'Investbank', label: 'بنك الاستثمار' },
  { value: 'Jordan_Commercial', label: 'البنك التجاري الأردني' },
  { value: 'ABC', label: 'بنك ABC' },
  { value: 'Standard_Chartered', label: 'ستاندارد تشارترد' },
  { value: 'BLOM', label: 'بنك بلوم' },
  { value: 'Al_Rajhi', label: 'مصرف الراجحي' },
  { value: 'OTHER', label: 'بنك آخر' },
];

// ==========================================
// Student Status Labels
// ==========================================
export const STUDENT_STATUS_MAP: Record<string, { label: string; cls: string; icon: string }> = {
  ACTIVE:    { label: 'مستمر',   cls: 'success',   icon: '✅' },
  POSTPONED: { label: 'مؤجل',   cls: 'warning',   icon: '⏸️' },
  WITHDRAWN: { label: 'منسحب',  cls: 'danger',    icon: '🚫' },
  CANCELED:  { label: 'ملغي',   cls: 'danger',    icon: '❌' },
  FINISHED:  { label: 'أنهى',   cls: 'secondary', icon: '🎓' },
};

// ==========================================
// Diploma Categories
// ==========================================
export const DIPLOMA_CATEGORIES = [
  { value: 'ADMINISTRATIVE', label: 'الدبلومات الإدارية' },
  { value: 'TECHNICAL', label: 'الدبلومات التقنية' },
  { value: 'HEALTH', label: 'الدبلومات الصحية' },
  { value: 'ARTISTIC', label: 'الدبلومات الفنية' },
  { value: 'PROFESSIONAL', label: 'الدبلومات المهنية' },
];

// ==========================================
// Subscription Status Labels
// ==========================================
export const SUB_STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'فعال',    cls: 'success' },
  GRADUATED: { label: 'خريج',   cls: 'primary' },
  WITHDRAWN: { label: 'منسحب',  cls: 'warning' },
  CANCELED:  { label: 'ملغي',   cls: 'danger' },
};
